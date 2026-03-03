import type { Request, Response, NextFunction } from "express";

/**
 * Middleware that intercepts HTML responses carrying a PAYMENT-RESPONSE header,
 * decodes the Stellar transaction hash, and replaces the `{{TX_LINK}}` placeholder
 * in the body with a link to Stellar Expert.
 *
 * Must be registered **before** the x402 payment middleware so that its
 * `res.end` / `res.write` wrappers sit on the outermost layer and see the
 * final bytes (after the x402 middleware has already set the header and
 * replayed the buffered body).
 */
export function txHashInjector() {
  return (_req: Request, res: Response, next: NextFunction) => {
    const originalWrite = res.write.bind(res) as Response["write"];
    const originalEnd = res.end.bind(res);
    type WriteFn = typeof res.write;
    const chunks: Buffer[] = [];

    res.write = function (...args: Parameters<WriteFn>) {
      const [chunk, encodingOrCb] = args;
      if (chunk != null) {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else {
          const encoding =
            typeof encodingOrCb === "string" ? (encodingOrCb as BufferEncoding) : "utf-8";
          chunks.push(Buffer.from(chunk as string, encoding));
        }
      }
      return true;
    } as WriteFn;

    res.end = function (...args: Parameters<typeof originalEnd>) {
      const [chunk, encodingOrCb] = args as [unknown, unknown, ...unknown[]];
      if (chunk != null && typeof chunk !== "function") {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else {
          const encoding =
            typeof encodingOrCb === "string" ? (encodingOrCb as BufferEncoding) : "utf-8";
          chunks.push(Buffer.from(chunk as string, encoding));
        }
      }

      const contentType = res.getHeader("content-type");
      const isHtml = typeof contentType === "string" && contentType.includes("text/html");

      if (!isHtml) {
        // Non-HTML: replay original buffers without transformation
        res.write = originalWrite;
        res.end = originalEnd;
        for (const buf of chunks) {
          originalWrite(buf);
        }
        const cb =
          typeof chunk === "function"
            ? chunk
            : typeof encodingOrCb === "function"
              ? encodingOrCb
              : undefined;
        return originalEnd(cb as (() => void) | undefined);
      }

      let body = Buffer.concat(chunks).toString("utf-8");

      if (body.includes("{{TX_LINK}}")) {
        const header = res.getHeader("payment-response") as string | undefined;
        body = injectTxLink(body, header);
      }

      res.setHeader("content-length", Buffer.byteLength(body));
      return originalEnd(body);
    } as typeof originalEnd;

    next();
  };
}

const STELLAR_EXPERT_BASE: Record<string, string> = {
  testnet: "https://stellar.expert/explorer/testnet/tx",
  pubnet: "https://stellar.expert/explorer/public/tx",
};

/**
 * Decode the PAYMENT-RESPONSE header and build a Stellar Expert link,
 * then replace `{{TX_LINK}}` in the HTML body.
 */
export function injectTxLink(body: string, paymentResponseHeader: string | undefined): string {
  if (!paymentResponseHeader) {
    return body.replace("{{TX_LINK}}", "");
  }

  try {
    const decoded = JSON.parse(Buffer.from(paymentResponseHeader, "base64").toString()) as {
      transaction?: string;
      network?: string;
    };

    const txHash = decoded.transaction;
    if (!txHash || !/^[0-9a-fA-F]+$/.test(txHash)) {
      return body.replace("{{TX_LINK}}", "");
    }

    // Derive the Stellar Expert network segment from the x402 network string
    // (e.g. "stellar:testnet" → "testnet", "stellar:pubnet" → "pubnet")
    const networkSegment = decoded.network?.split(":")?.[1] ?? "testnet";
    const base = STELLAR_EXPERT_BASE[networkSegment] ?? STELLAR_EXPERT_BASE.testnet;
    const url = `${base}/${txHash}`;

    const link =
      `<a href="${url}" target="_blank" rel="noopener noreferrer" ` +
      `style="color:#38bdf8;text-decoration:none;">View transaction on Stellar Expert &rarr;</a>`;

    return body.replace("{{TX_LINK}}", link);
  } catch {
    return body.replace("{{TX_LINK}}", "");
  }
}
