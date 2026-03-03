"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  BAZAAR: () => BAZAAR,
  EIP2612_GAS_SPONSORING: () => EIP2612_GAS_SPONSORING,
  InMemorySIWxStorage: () => InMemorySIWxStorage,
  PAYMENT_IDENTIFIER: () => PAYMENT_IDENTIFIER,
  PAYMENT_ID_MAX_LENGTH: () => PAYMENT_ID_MAX_LENGTH,
  PAYMENT_ID_MIN_LENGTH: () => PAYMENT_ID_MIN_LENGTH,
  PAYMENT_ID_PATTERN: () => PAYMENT_ID_PATTERN,
  SIGN_IN_WITH_X: () => SIGN_IN_WITH_X,
  SIWxPayloadSchema: () => SIWxPayloadSchema,
  SOLANA_DEVNET: () => SOLANA_DEVNET,
  SOLANA_MAINNET: () => SOLANA_MAINNET,
  SOLANA_TESTNET: () => SOLANA_TESTNET,
  appendPaymentIdentifierToExtensions: () => appendPaymentIdentifierToExtensions,
  bazaarResourceServerExtension: () => bazaarResourceServerExtension,
  buildSIWxSchema: () => buildSIWxSchema,
  createSIWxClientHook: () => createSIWxClientHook,
  createSIWxMessage: () => createSIWxMessage,
  createSIWxPayload: () => createSIWxPayload,
  createSIWxRequestHook: () => createSIWxRequestHook,
  createSIWxSettleHook: () => createSIWxSettleHook,
  declareDiscoveryExtension: () => declareDiscoveryExtension,
  declareEip2612GasSponsoringExtension: () => declareEip2612GasSponsoringExtension,
  declarePaymentIdentifierExtension: () => declarePaymentIdentifierExtension,
  declareSIWxExtension: () => declareSIWxExtension,
  decodeBase58: () => decodeBase58,
  encodeBase58: () => encodeBase58,
  encodeSIWxHeader: () => encodeSIWxHeader,
  extractAndValidatePaymentIdentifier: () => extractAndValidatePaymentIdentifier,
  extractDiscoveryInfo: () => extractDiscoveryInfo,
  extractDiscoveryInfoFromExtension: () => extractDiscoveryInfoFromExtension,
  extractDiscoveryInfoV1: () => extractDiscoveryInfoV1,
  extractEVMChainId: () => extractEVMChainId,
  extractEip2612GasSponsoringInfo: () => extractEip2612GasSponsoringInfo,
  extractPaymentIdentifier: () => extractPaymentIdentifier,
  extractResourceMetadataV1: () => extractResourceMetadataV1,
  extractSolanaChainReference: () => extractSolanaChainReference,
  formatSIWEMessage: () => formatSIWEMessage,
  formatSIWSMessage: () => formatSIWSMessage,
  generatePaymentId: () => generatePaymentId,
  getEVMAddress: () => getEVMAddress,
  getSolanaAddress: () => getSolanaAddress,
  hasPaymentIdentifier: () => hasPaymentIdentifier,
  isBodyExtensionConfig: () => isBodyExtensionConfig,
  isDiscoverableV1: () => isDiscoverableV1,
  isEVMSigner: () => isEVMSigner,
  isMcpExtensionConfig: () => isMcpExtensionConfig,
  isPaymentIdentifierExtension: () => isPaymentIdentifierExtension,
  isPaymentIdentifierRequired: () => isPaymentIdentifierRequired,
  isQueryExtensionConfig: () => isQueryExtensionConfig,
  isSolanaSigner: () => isSolanaSigner,
  isValidPaymentId: () => isValidPaymentId,
  parseSIWxHeader: () => parseSIWxHeader,
  paymentIdentifierResourceServerExtension: () => paymentIdentifierResourceServerExtension,
  paymentIdentifierSchema: () => paymentIdentifierSchema,
  signEVMMessage: () => signEVMMessage,
  signSolanaMessage: () => signSolanaMessage,
  siwxResourceServerExtension: () => siwxResourceServerExtension,
  validateAndExtract: () => validateAndExtract,
  validateDiscoveryExtension: () => validateDiscoveryExtension,
  validateEip2612GasSponsoringInfo: () => validateEip2612GasSponsoringInfo,
  validatePaymentIdentifier: () => validatePaymentIdentifier,
  validatePaymentIdentifierRequirement: () => validatePaymentIdentifierRequirement,
  validateSIWxMessage: () => validateSIWxMessage,
  verifyEVMSignature: () => verifyEVMSignature,
  verifySIWxSignature: () => verifySIWxSignature,
  verifySolanaSignature: () => verifySolanaSignature,
  withBazaar: () => withBazaar,
  wrapFetchWithSIWx: () => wrapFetchWithSIWx
});
module.exports = __toCommonJS(src_exports);

// src/bazaar/http/types.ts
var isQueryExtensionConfig = (config) => {
  return !("bodyType" in config) && !("toolName" in config);
};
var isBodyExtensionConfig = (config) => {
  return "bodyType" in config;
};

// src/bazaar/mcp/types.ts
var isMcpExtensionConfig = (config) => {
  return "toolName" in config;
};

// src/bazaar/types.ts
var BAZAAR = { key: "bazaar" };

// src/bazaar/http/resourceService.ts
function createQueryDiscoveryExtension({
  method,
  input = {},
  inputSchema = { properties: {} },
  output
}) {
  return {
    info: {
      input: {
        type: "http",
        ...method ? { method } : {},
        ...input ? { queryParams: input } : {}
      },
      ...output?.example ? {
        output: {
          type: "json",
          example: output.example
        }
      } : {}
    },
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        input: {
          type: "object",
          properties: {
            type: {
              type: "string",
              const: "http"
            },
            method: {
              type: "string",
              enum: ["GET", "HEAD", "DELETE"]
            },
            ...inputSchema ? {
              queryParams: {
                type: "object",
                ...typeof inputSchema === "object" ? inputSchema : {}
              }
            } : {}
          },
          required: ["type"],
          additionalProperties: false
        },
        ...output?.example ? {
          output: {
            type: "object",
            properties: {
              type: {
                type: "string"
              },
              example: {
                type: "object",
                ...output.schema && typeof output.schema === "object" ? output.schema : {}
              }
            },
            required: ["type"]
          }
        } : {}
      },
      required: ["input"]
    }
  };
}
function createBodyDiscoveryExtension({
  method,
  input = {},
  inputSchema = { properties: {} },
  bodyType,
  output
}) {
  return {
    info: {
      input: {
        type: "http",
        ...method ? { method } : {},
        bodyType,
        body: input
      },
      ...output?.example ? {
        output: {
          type: "json",
          example: output.example
        }
      } : {}
    },
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        input: {
          type: "object",
          properties: {
            type: {
              type: "string",
              const: "http"
            },
            method: {
              type: "string",
              enum: ["POST", "PUT", "PATCH"]
            },
            bodyType: {
              type: "string",
              enum: ["json", "form-data", "text"]
            },
            body: inputSchema
          },
          required: ["type", "bodyType", "body"],
          additionalProperties: false
        },
        ...output?.example ? {
          output: {
            type: "object",
            properties: {
              type: {
                type: "string"
              },
              example: {
                type: "object",
                ...output.schema && typeof output.schema === "object" ? output.schema : {}
              }
            },
            required: ["type"]
          }
        } : {}
      },
      required: ["input"]
    }
  };
}

// src/bazaar/mcp/resourceService.ts
function createMcpDiscoveryExtension({
  toolName,
  description,
  transport,
  inputSchema,
  example,
  output
}) {
  return {
    info: {
      input: {
        type: "mcp",
        toolName,
        ...description !== void 0 ? { description } : {},
        ...transport !== void 0 ? { transport } : {},
        inputSchema,
        ...example !== void 0 ? { example } : {}
      },
      ...output?.example ? {
        output: {
          type: "json",
          example: output.example
        }
      } : {}
    },
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        input: {
          type: "object",
          properties: {
            type: {
              type: "string",
              const: "mcp"
            },
            toolName: {
              type: "string"
            },
            ...description !== void 0 ? {
              description: {
                type: "string"
              }
            } : {},
            ...transport !== void 0 ? {
              transport: {
                type: "string",
                enum: ["streamable-http", "sse"]
              }
            } : {},
            inputSchema: {
              type: "object"
            },
            ...example !== void 0 ? {
              example: {
                type: "object"
              }
            } : {}
          },
          required: ["type", "toolName", "inputSchema"],
          additionalProperties: false
        },
        ...output?.example ? {
          output: {
            type: "object",
            properties: {
              type: {
                type: "string"
              },
              example: {
                type: "object",
                ...output.schema && typeof output.schema === "object" ? output.schema : {}
              }
            },
            required: ["type"]
          }
        } : {}
      },
      required: ["input"]
    }
  };
}

// src/bazaar/resourceService.ts
function declareDiscoveryExtension(config) {
  if ("toolName" in config) {
    const extension2 = createMcpDiscoveryExtension(config);
    return { bazaar: extension2 };
  }
  const bodyType = config.bodyType;
  const isBodyMethod2 = bodyType !== void 0;
  const extension = isBodyMethod2 ? createBodyDiscoveryExtension(config) : createQueryDiscoveryExtension(config);
  return { bazaar: extension };
}

// src/bazaar/server.ts
function isHTTPRequestContext(ctx) {
  return ctx !== null && typeof ctx === "object" && "method" in ctx && "adapter" in ctx;
}
var bazaarResourceServerExtension = {
  key: BAZAAR.key,
  enrichDeclaration: (declaration, transportContext) => {
    if (!isHTTPRequestContext(transportContext)) {
      return declaration;
    }
    const extension = declaration;
    if (extension.info?.input?.type === "mcp") {
      return declaration;
    }
    const method = transportContext.method;
    const existingInputProps = extension.schema?.properties?.input?.properties || {};
    const updatedInputProps = {
      ...existingInputProps,
      method: {
        type: "string",
        enum: [method]
      }
    };
    return {
      ...extension,
      info: {
        ...extension.info || {},
        input: {
          ...extension.info?.input || {},
          method
        }
      },
      schema: {
        ...extension.schema || {},
        properties: {
          ...extension.schema?.properties || {},
          input: {
            ...extension.schema?.properties?.input || {},
            properties: updatedInputProps,
            required: [
              ...extension.schema?.properties?.input?.required || [],
              ...!(extension.schema?.properties?.input?.required || []).includes("method") ? ["method"] : []
            ]
          }
        }
      }
    };
  }
};

// src/bazaar/facilitator.ts
var import__ = __toESM(require("ajv/dist/2020.js"));

// src/bazaar/v1/facilitator.ts
function hasV1OutputSchema(obj) {
  return obj !== null && typeof obj === "object" && "input" in obj && obj.input !== null && typeof obj.input === "object" && "type" in obj.input && obj.input.type === "http" && "method" in obj.input;
}
function isQueryMethod(method) {
  const upperMethod = method.toUpperCase();
  return upperMethod === "GET" || upperMethod === "HEAD" || upperMethod === "DELETE";
}
function isBodyMethod(method) {
  const upperMethod = method.toUpperCase();
  return upperMethod === "POST" || upperMethod === "PUT" || upperMethod === "PATCH";
}
function extractQueryParams(v1Input) {
  if (v1Input.queryParams && typeof v1Input.queryParams === "object") {
    return v1Input.queryParams;
  }
  if (v1Input.query_params && typeof v1Input.query_params === "object") {
    return v1Input.query_params;
  }
  if (v1Input.query && typeof v1Input.query === "object") {
    return v1Input.query;
  }
  if (v1Input.params && typeof v1Input.params === "object") {
    return v1Input.params;
  }
  return void 0;
}
function extractBodyInfo(v1Input) {
  let bodyType = "json";
  const bodyTypeField = v1Input.bodyType || v1Input.body_type;
  if (bodyTypeField && typeof bodyTypeField === "string") {
    const type = bodyTypeField.toLowerCase();
    if (type.includes("form") || type.includes("multipart")) {
      bodyType = "form-data";
    } else if (type.includes("text") || type.includes("plain")) {
      bodyType = "text";
    } else {
      bodyType = "json";
    }
  }
  let body = {};
  if (v1Input.bodyFields && typeof v1Input.bodyFields === "object") {
    body = v1Input.bodyFields;
  } else if (v1Input.body_fields && v1Input.body_fields !== null && typeof v1Input.body_fields === "object") {
    body = v1Input.body_fields;
  } else if (v1Input.bodyParams && typeof v1Input.bodyParams === "object") {
    body = v1Input.bodyParams;
  } else if (v1Input.body && typeof v1Input.body === "object") {
    body = v1Input.body;
  } else if (v1Input.data && typeof v1Input.data === "object") {
    body = v1Input.data;
  } else if (v1Input.properties && typeof v1Input.properties === "object") {
    body = v1Input.properties;
  }
  return { body, bodyType };
}
function extractDiscoveryInfoV1(paymentRequirements) {
  const { outputSchema } = paymentRequirements;
  if (!outputSchema || !hasV1OutputSchema(outputSchema)) {
    return null;
  }
  const v1Input = outputSchema.input;
  const isDiscoverable = v1Input.discoverable ?? true;
  if (!isDiscoverable) {
    return null;
  }
  const method = typeof v1Input.method === "string" ? v1Input.method.toUpperCase() : "";
  const headersRaw = v1Input.headerFields || v1Input.header_fields || v1Input.headers;
  const headers = headersRaw && typeof headersRaw === "object" ? headersRaw : void 0;
  const output = outputSchema.output ? {
    type: "json",
    example: outputSchema.output
  } : void 0;
  if (isQueryMethod(method)) {
    const queryParams = extractQueryParams(v1Input);
    const discoveryInfo = {
      input: {
        type: "http",
        method,
        ...queryParams ? { queryParams } : {},
        ...headers ? { headers } : {}
      },
      ...output ? { output } : {}
    };
    return discoveryInfo;
  } else if (isBodyMethod(method)) {
    const { body, bodyType } = extractBodyInfo(v1Input);
    const queryParams = extractQueryParams(v1Input);
    const discoveryInfo = {
      input: {
        type: "http",
        method,
        bodyType,
        body,
        ...queryParams ? { queryParams } : {},
        ...headers ? { headers } : {}
      },
      ...output ? { output } : {}
    };
    return discoveryInfo;
  }
  return null;
}
function isDiscoverableV1(paymentRequirements) {
  return extractDiscoveryInfoV1(paymentRequirements) !== null;
}
function extractResourceMetadataV1(paymentRequirements) {
  return {
    url: paymentRequirements.resource,
    description: paymentRequirements.description,
    mimeType: paymentRequirements.mimeType
  };
}

// src/bazaar/facilitator.ts
function validateDiscoveryExtension(extension) {
  try {
    const ajv = new import__.default({ strict: false, allErrors: true });
    const validate = ajv.compile(extension.schema);
    const valid = validate(extension.info);
    if (valid) {
      return { valid: true };
    }
    const errors = validate.errors?.map((err) => {
      const path = err.instancePath || "(root)";
      return `${path}: ${err.message}`;
    }) || ["Unknown validation error"];
    return { valid: false, errors };
  } catch (error) {
    return {
      valid: false,
      errors: [
        `Schema validation failed: ${error instanceof Error ? error.message : String(error)}`
      ]
    };
  }
}
function extractDiscoveryInfo(paymentPayload, paymentRequirements, validate = true) {
  let discoveryInfo = null;
  let resourceUrl;
  if (paymentPayload.x402Version === 2) {
    resourceUrl = paymentPayload.resource?.url ?? "";
    if (paymentPayload.extensions) {
      const bazaarExtension = paymentPayload.extensions[BAZAAR.key];
      if (bazaarExtension && typeof bazaarExtension === "object") {
        try {
          const extension = bazaarExtension;
          if (validate) {
            const result = validateDiscoveryExtension(extension);
            if (!result.valid) {
              console.warn(
                `V2 discovery extension validation failed: ${result.errors?.join(", ")}`
              );
            } else {
              discoveryInfo = extension.info;
            }
          } else {
            discoveryInfo = extension.info;
          }
        } catch (error) {
          console.warn(`V2 discovery extension extraction failed: ${error}`);
        }
      }
    }
  } else if (paymentPayload.x402Version === 1) {
    const requirementsV1 = paymentRequirements;
    resourceUrl = requirementsV1.resource;
    discoveryInfo = extractDiscoveryInfoV1(requirementsV1);
  } else {
    return null;
  }
  if (!discoveryInfo) {
    return null;
  }
  const url = new URL(resourceUrl);
  const normalizedResourceUrl = `${url.origin}${url.pathname}`;
  let description;
  let mimeType;
  if (paymentPayload.x402Version === 2) {
    description = paymentPayload.resource?.description;
    mimeType = paymentPayload.resource?.mimeType;
  } else if (paymentPayload.x402Version === 1) {
    const requirementsV1 = paymentRequirements;
    description = requirementsV1.description;
    mimeType = requirementsV1.mimeType;
  }
  const base = {
    resourceUrl: normalizedResourceUrl,
    description,
    mimeType,
    x402Version: paymentPayload.x402Version,
    discoveryInfo
  };
  if (discoveryInfo.input.type === "mcp") {
    return { ...base, toolName: discoveryInfo.input.toolName };
  }
  return { ...base, method: discoveryInfo.input.method };
}
function extractDiscoveryInfoFromExtension(extension, validate = true) {
  if (validate) {
    const result = validateDiscoveryExtension(extension);
    if (!result.valid) {
      throw new Error(
        `Invalid discovery extension: ${result.errors?.join(", ") || "Unknown error"}`
      );
    }
  }
  return extension.info;
}
function validateAndExtract(extension) {
  const result = validateDiscoveryExtension(extension);
  if (result.valid) {
    return {
      valid: true,
      info: extension.info
    };
  }
  return {
    valid: false,
    errors: result.errors
  };
}

// src/bazaar/facilitatorClient.ts
function withBazaar(client) {
  const existingExtensions = client.extensions ?? {};
  const extended = client;
  extended.extensions = {
    ...existingExtensions,
    discovery: {
      async listResources(params) {
        let headers = {
          "Content-Type": "application/json"
        };
        const authHeaders = await client.createAuthHeaders("discovery");
        headers = { ...headers, ...authHeaders.headers };
        const queryParams = new URLSearchParams();
        if (params?.type !== void 0) {
          queryParams.set("type", params.type);
        }
        if (params?.limit !== void 0) {
          queryParams.set("limit", params.limit.toString());
        }
        if (params?.offset !== void 0) {
          queryParams.set("offset", params.offset.toString());
        }
        const queryString = queryParams.toString();
        const endpoint = `${client.url}/discovery/resources${queryString ? `?${queryString}` : ""}`;
        const response = await fetch(endpoint, {
          method: "GET",
          headers
        });
        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          throw new Error(
            `Facilitator listDiscoveryResources failed (${response.status}): ${errorText}`
          );
        }
        return await response.json();
      }
    }
  };
  return extended;
}

// src/sign-in-with-x/types.ts
var import_zod = require("zod");
var SIGN_IN_WITH_X = "sign-in-with-x";
var SIWxPayloadSchema = import_zod.z.object({
  domain: import_zod.z.string(),
  address: import_zod.z.string(),
  statement: import_zod.z.string().optional(),
  uri: import_zod.z.string(),
  version: import_zod.z.string(),
  chainId: import_zod.z.string(),
  type: import_zod.z.enum(["eip191", "ed25519"]),
  nonce: import_zod.z.string(),
  issuedAt: import_zod.z.string(),
  expirationTime: import_zod.z.string().optional(),
  notBefore: import_zod.z.string().optional(),
  requestId: import_zod.z.string().optional(),
  resources: import_zod.z.array(import_zod.z.string()).optional(),
  signatureScheme: import_zod.z.enum(["eip191", "eip1271", "eip6492", "siws"]).optional(),
  signature: import_zod.z.string()
});

// src/sign-in-with-x/solana.ts
var import_base = require("@scure/base");
var import_tweetnacl = __toESM(require("tweetnacl"));
var SOLANA_MAINNET = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
var SOLANA_DEVNET = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
var SOLANA_TESTNET = "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z";
function extractSolanaChainReference(chainId) {
  const [, reference] = chainId.split(":");
  return reference;
}
function formatSIWSMessage(info, address) {
  const lines = [
    `${info.domain} wants you to sign in with your Solana account:`,
    address,
    ""
  ];
  if (info.statement) {
    lines.push(info.statement, "");
  }
  lines.push(
    `URI: ${info.uri}`,
    `Version: ${info.version}`,
    `Chain ID: ${extractSolanaChainReference(info.chainId)}`,
    `Nonce: ${info.nonce}`,
    `Issued At: ${info.issuedAt}`
  );
  if (info.expirationTime) {
    lines.push(`Expiration Time: ${info.expirationTime}`);
  }
  if (info.notBefore) {
    lines.push(`Not Before: ${info.notBefore}`);
  }
  if (info.requestId) {
    lines.push(`Request ID: ${info.requestId}`);
  }
  if (info.resources && info.resources.length > 0) {
    lines.push("Resources:");
    for (const resource of info.resources) {
      lines.push(`- ${resource}`);
    }
  }
  return lines.join("\n");
}
function verifySolanaSignature(message, signature, publicKey) {
  const messageBytes = new TextEncoder().encode(message);
  return import_tweetnacl.default.sign.detached.verify(messageBytes, signature, publicKey);
}
function decodeBase58(encoded) {
  return import_base.base58.decode(encoded);
}
function encodeBase58(bytes) {
  return import_base.base58.encode(bytes);
}
function isSolanaSigner(signer) {
  if ("signMessages" in signer && typeof signer.signMessages === "function") {
    return true;
  }
  if ("publicKey" in signer && signer.publicKey) {
    const pk = signer.publicKey;
    if (typeof pk === "object" && pk !== null && "toBase58" in pk) {
      return true;
    }
    if (typeof pk === "string" && !pk.startsWith("0x")) {
      return true;
    }
  }
  return false;
}

// src/sign-in-with-x/schema.ts
function buildSIWxSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      domain: { type: "string" },
      address: { type: "string" },
      statement: { type: "string" },
      uri: { type: "string", format: "uri" },
      version: { type: "string" },
      chainId: { type: "string" },
      type: { type: "string" },
      nonce: { type: "string" },
      issuedAt: { type: "string", format: "date-time" },
      expirationTime: { type: "string", format: "date-time" },
      notBefore: { type: "string", format: "date-time" },
      requestId: { type: "string" },
      resources: { type: "array", items: { type: "string", format: "uri" } },
      signature: { type: "string" }
    },
    required: [
      "domain",
      "address",
      "uri",
      "version",
      "chainId",
      "type",
      "nonce",
      "issuedAt",
      "signature"
    ]
  };
}

// src/sign-in-with-x/declare.ts
function getSignatureType(network) {
  return network.startsWith("solana:") ? "ed25519" : "eip191";
}
function declareSIWxExtension(options = {}) {
  const info = {
    version: options.version ?? "1"
  };
  if (options.domain) {
    info.domain = options.domain;
  }
  if (options.resourceUri) {
    info.uri = options.resourceUri;
    info.resources = [options.resourceUri];
  }
  if (options.statement) {
    info.statement = options.statement;
  }
  let supportedChains = [];
  if (options.network) {
    const networks = Array.isArray(options.network) ? options.network : [options.network];
    supportedChains = networks.map((network) => ({
      chainId: network,
      type: getSignatureType(network)
    }));
  }
  const declaration = {
    info,
    supportedChains,
    schema: buildSIWxSchema(),
    _options: options
  };
  return { [SIGN_IN_WITH_X]: declaration };
}

// src/sign-in-with-x/server.ts
var import_crypto = require("crypto");
var siwxResourceServerExtension = {
  key: SIGN_IN_WITH_X,
  enrichPaymentRequiredResponse: async (declaration, context) => {
    const decl = declaration;
    const opts = decl._options ?? {};
    const resourceUri = opts.resourceUri ?? context.resourceInfo.url;
    let domain = opts.domain;
    if (!domain && resourceUri) {
      try {
        domain = new URL(resourceUri).hostname;
      } catch {
      }
    }
    let networks;
    if (opts.network) {
      networks = Array.isArray(opts.network) ? opts.network : [opts.network];
    } else {
      networks = [...new Set(context.requirements.map((r) => r.network))];
    }
    const nonce = (0, import_crypto.randomBytes)(16).toString("hex");
    const issuedAt = (/* @__PURE__ */ new Date()).toISOString();
    const expirationSeconds = opts.expirationSeconds;
    const expirationTime = expirationSeconds !== void 0 ? new Date(Date.now() + expirationSeconds * 1e3).toISOString() : void 0;
    const info = {
      domain: domain ?? "",
      uri: resourceUri,
      version: opts.version ?? "1",
      nonce,
      issuedAt,
      resources: [resourceUri]
    };
    if (expirationTime) {
      info.expirationTime = expirationTime;
    }
    if (opts.statement) {
      info.statement = opts.statement;
    }
    const supportedChains = networks.map((network) => ({
      chainId: network,
      type: getSignatureType(network)
    }));
    return {
      info,
      supportedChains,
      schema: buildSIWxSchema()
    };
  }
};

// src/sign-in-with-x/parse.ts
var import_utils = require("@x402/core/utils");
function parseSIWxHeader(header) {
  if (!import_utils.Base64EncodedRegex.test(header)) {
    throw new Error("Invalid SIWX header: not valid base64");
  }
  const jsonStr = (0, import_utils.safeBase64Decode)(header);
  let rawPayload;
  try {
    rawPayload = JSON.parse(jsonStr);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid SIWX header: not valid JSON");
    }
    throw error;
  }
  const parsed = SIWxPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`Invalid SIWX header: ${issues}`);
  }
  return parsed.data;
}

// src/sign-in-with-x/validate.ts
var DEFAULT_MAX_AGE_MS = 5 * 60 * 1e3;
async function validateSIWxMessage(message, expectedResourceUri, options = {}) {
  const expectedUrl = new URL(expectedResourceUri);
  const maxAge = options.maxAge ?? DEFAULT_MAX_AGE_MS;
  if (message.domain !== expectedUrl.hostname) {
    return {
      valid: false,
      error: `Domain mismatch: expected "${expectedUrl.hostname}", got "${message.domain}"`
    };
  }
  if (!message.uri.startsWith(expectedUrl.origin)) {
    return {
      valid: false,
      error: `URI mismatch: expected origin "${expectedUrl.origin}", got "${message.uri}"`
    };
  }
  const issuedAt = new Date(message.issuedAt);
  if (isNaN(issuedAt.getTime())) {
    return {
      valid: false,
      error: "Invalid issuedAt timestamp"
    };
  }
  const age = Date.now() - issuedAt.getTime();
  if (age > maxAge) {
    return {
      valid: false,
      error: `Message too old: ${Math.round(age / 1e3)}s exceeds ${maxAge / 1e3}s limit`
    };
  }
  if (age < 0) {
    return {
      valid: false,
      error: "issuedAt is in the future"
    };
  }
  if (message.expirationTime) {
    const expiration = new Date(message.expirationTime);
    if (isNaN(expiration.getTime())) {
      return {
        valid: false,
        error: "Invalid expirationTime timestamp"
      };
    }
    if (expiration < /* @__PURE__ */ new Date()) {
      return {
        valid: false,
        error: "Message expired"
      };
    }
  }
  if (message.notBefore) {
    const notBefore = new Date(message.notBefore);
    if (isNaN(notBefore.getTime())) {
      return {
        valid: false,
        error: "Invalid notBefore timestamp"
      };
    }
    if (/* @__PURE__ */ new Date() < notBefore) {
      return {
        valid: false,
        error: "Message not yet valid (notBefore is in the future)"
      };
    }
  }
  if (options.checkNonce) {
    const nonceValid = await options.checkNonce(message.nonce);
    if (!nonceValid) {
      return {
        valid: false,
        error: "Nonce validation failed (possible replay attack)"
      };
    }
  }
  return { valid: true };
}

// src/sign-in-with-x/evm.ts
var import_viem = require("viem");
var import_siwe = require("siwe");
function extractEVMChainId(chainId) {
  const match = /^eip155:(\d+)$/.exec(chainId);
  if (!match) {
    throw new Error(`Invalid EVM chainId format: ${chainId}. Expected eip155:<number>`);
  }
  return parseInt(match[1], 10);
}
function formatSIWEMessage(info, address) {
  const numericChainId = extractEVMChainId(info.chainId);
  const siweMessage = new import_siwe.SiweMessage({
    domain: info.domain,
    address,
    statement: info.statement,
    uri: info.uri,
    version: info.version,
    chainId: numericChainId,
    nonce: info.nonce,
    issuedAt: info.issuedAt,
    expirationTime: info.expirationTime,
    notBefore: info.notBefore,
    requestId: info.requestId,
    resources: info.resources
  });
  return siweMessage.prepareMessage();
}
async function verifyEVMSignature(message, address, signature, verifier) {
  const args = {
    address,
    message,
    signature
  };
  if (verifier) {
    return verifier(args);
  }
  return (0, import_viem.verifyMessage)(args);
}
function isEVMSigner(signer) {
  if ("signMessages" in signer && typeof signer.signMessages === "function") {
    return false;
  }
  if ("publicKey" in signer && signer.publicKey) {
    const pk = signer.publicKey;
    if (typeof pk === "object" && pk !== null && "toBase58" in pk) {
      return false;
    }
    if (typeof pk === "string" && !pk.startsWith("0x")) {
      return false;
    }
  }
  if ("account" in signer && signer.account && typeof signer.account === "object") {
    const account = signer.account;
    if (account.address && account.address.startsWith("0x")) {
      return true;
    }
  }
  if ("address" in signer && typeof signer.address === "string" && signer.address.startsWith("0x")) {
    return true;
  }
  return false;
}

// src/sign-in-with-x/verify.ts
async function verifySIWxSignature(payload, options) {
  try {
    if (payload.chainId.startsWith("eip155:")) {
      return verifyEVMPayload(payload, options?.evmVerifier);
    }
    if (payload.chainId.startsWith("solana:")) {
      return verifySolanaPayload(payload);
    }
    return {
      valid: false,
      error: `Unsupported chain namespace: ${payload.chainId}. Supported: eip155:* (EVM), solana:* (Solana)`
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Verification failed"
    };
  }
}
async function verifyEVMPayload(payload, verifier) {
  const message = formatSIWEMessage(
    {
      domain: payload.domain,
      uri: payload.uri,
      statement: payload.statement,
      version: payload.version,
      chainId: payload.chainId,
      type: payload.type,
      nonce: payload.nonce,
      issuedAt: payload.issuedAt,
      expirationTime: payload.expirationTime,
      notBefore: payload.notBefore,
      requestId: payload.requestId,
      resources: payload.resources
    },
    payload.address
  );
  try {
    const valid = await verifyEVMSignature(message, payload.address, payload.signature, verifier);
    if (!valid) {
      return {
        valid: false,
        error: "Signature verification failed"
      };
    }
    return {
      valid: true,
      address: payload.address
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Signature verification failed"
    };
  }
}
function verifySolanaPayload(payload) {
  const message = formatSIWSMessage(
    {
      domain: payload.domain,
      uri: payload.uri,
      statement: payload.statement,
      version: payload.version,
      chainId: payload.chainId,
      type: payload.type,
      nonce: payload.nonce,
      issuedAt: payload.issuedAt,
      expirationTime: payload.expirationTime,
      notBefore: payload.notBefore,
      requestId: payload.requestId,
      resources: payload.resources
    },
    payload.address
  );
  let signature;
  let publicKey;
  try {
    signature = decodeBase58(payload.signature);
    publicKey = decodeBase58(payload.address);
  } catch (error) {
    return {
      valid: false,
      error: `Invalid Base58 encoding: ${error instanceof Error ? error.message : "decode failed"}`
    };
  }
  if (signature.length !== 64) {
    return {
      valid: false,
      error: `Invalid signature length: expected 64 bytes, got ${signature.length}`
    };
  }
  if (publicKey.length !== 32) {
    return {
      valid: false,
      error: `Invalid public key length: expected 32 bytes, got ${publicKey.length}`
    };
  }
  const valid = verifySolanaSignature(message, signature, publicKey);
  if (!valid) {
    return {
      valid: false,
      error: "Solana signature verification failed"
    };
  }
  return {
    valid: true,
    address: payload.address
  };
}

// src/sign-in-with-x/message.ts
function createSIWxMessage(serverInfo, address) {
  if (serverInfo.chainId.startsWith("eip155:")) {
    return formatSIWEMessage(serverInfo, address);
  }
  if (serverInfo.chainId.startsWith("solana:")) {
    return formatSIWSMessage(serverInfo, address);
  }
  throw new Error(
    `Unsupported chain namespace: ${serverInfo.chainId}. Supported: eip155:* (EVM), solana:* (Solana)`
  );
}

// src/sign-in-with-x/sign.ts
function getEVMAddress(signer) {
  if (signer.account?.address) {
    return signer.account.address;
  }
  if (signer.address) {
    return signer.address;
  }
  throw new Error("EVM signer missing address");
}
function getSolanaAddress(signer) {
  if ("address" in signer && signer.address) {
    return signer.address;
  }
  if ("publicKey" in signer) {
    const pk = signer.publicKey;
    return typeof pk === "string" ? pk : pk.toBase58();
  }
  throw new Error("Solana signer missing address or publicKey");
}
async function signEVMMessage(message, signer) {
  if (signer.account) {
    return signer.signMessage({ message, account: signer.account });
  }
  return signer.signMessage({ message });
}
async function signSolanaMessage(message, signer) {
  const messageBytes = new TextEncoder().encode(message);
  if ("signMessages" in signer) {
    const results = await signer.signMessages([{ content: messageBytes, signatures: {} }]);
    const sigDict = results[0];
    const signatureBytes = Object.values(sigDict)[0];
    return encodeBase58(signatureBytes);
  }
  if ("signMessage" in signer) {
    const signatureBytes = await signer.signMessage(messageBytes);
    return encodeBase58(signatureBytes);
  }
  throw new Error("Solana signer missing signMessage or signMessages method");
}

// src/sign-in-with-x/client.ts
async function createSIWxPayload(serverExtension, signer) {
  const isSolana = serverExtension.chainId.startsWith("solana:");
  const address = isSolana ? getSolanaAddress(signer) : getEVMAddress(signer);
  const message = createSIWxMessage(serverExtension, address);
  const signature = isSolana ? await signSolanaMessage(message, signer) : await signEVMMessage(message, signer);
  return {
    domain: serverExtension.domain,
    address,
    statement: serverExtension.statement,
    uri: serverExtension.uri,
    version: serverExtension.version,
    chainId: serverExtension.chainId,
    type: serverExtension.type,
    nonce: serverExtension.nonce,
    issuedAt: serverExtension.issuedAt,
    expirationTime: serverExtension.expirationTime,
    notBefore: serverExtension.notBefore,
    requestId: serverExtension.requestId,
    resources: serverExtension.resources,
    signatureScheme: serverExtension.signatureScheme,
    signature
  };
}

// src/sign-in-with-x/encode.ts
var import_utils2 = require("@x402/core/utils");
function encodeSIWxHeader(payload) {
  return (0, import_utils2.safeBase64Encode)(JSON.stringify(payload));
}

// src/sign-in-with-x/fetch.ts
var import_http = require("@x402/core/http");
function wrapFetchWithSIWx(fetch2, signer) {
  return async (input, init) => {
    const request = new Request(input, init);
    const clonedRequest = request.clone();
    const response = await fetch2(request);
    if (response.status !== 402) {
      return response;
    }
    const paymentRequiredHeader = response.headers.get("PAYMENT-REQUIRED");
    if (!paymentRequiredHeader) {
      return response;
    }
    const paymentRequired = (0, import_http.decodePaymentRequiredHeader)(paymentRequiredHeader);
    const siwxExtension = paymentRequired.extensions?.[SIGN_IN_WITH_X];
    if (!siwxExtension?.supportedChains) {
      return response;
    }
    if (clonedRequest.headers.has(SIGN_IN_WITH_X)) {
      throw new Error("SIWX authentication already attempted");
    }
    const paymentNetwork = paymentRequired.accepts?.[0]?.network;
    if (!paymentNetwork) {
      return response;
    }
    const matchingChain = siwxExtension.supportedChains.find(
      (chain) => chain.chainId === paymentNetwork
    );
    if (!matchingChain) {
      return response;
    }
    const completeInfo = {
      ...siwxExtension.info,
      chainId: matchingChain.chainId,
      type: matchingChain.type
    };
    const payload = await createSIWxPayload(completeInfo, signer);
    const siwxHeader = encodeSIWxHeader(payload);
    clonedRequest.headers.set(SIGN_IN_WITH_X, siwxHeader);
    return fetch2(clonedRequest);
  };
}

// src/sign-in-with-x/storage.ts
var InMemorySIWxStorage = class {
  constructor() {
    this.paidAddresses = /* @__PURE__ */ new Map();
  }
  /**
   * Check if an address has paid for a resource.
   *
   * @param resource - The resource path
   * @param address - The wallet address to check
   * @returns True if the address has paid
   */
  hasPaid(resource, address) {
    return this.paidAddresses.get(resource)?.has(address.toLowerCase()) ?? false;
  }
  /**
   * Record that an address has paid for a resource.
   *
   * @param resource - The resource path
   * @param address - The wallet address that paid
   */
  recordPayment(resource, address) {
    if (!this.paidAddresses.has(resource)) {
      this.paidAddresses.set(resource, /* @__PURE__ */ new Set());
    }
    this.paidAddresses.get(resource).add(address.toLowerCase());
  }
};

// src/sign-in-with-x/hooks.ts
function createSIWxSettleHook(options) {
  const { storage, onEvent } = options;
  return async (ctx) => {
    if (!ctx.result.success) return;
    const address = ctx.result.payer;
    if (!address) return;
    const resourceUrl = ctx.paymentPayload.resource?.url;
    if (!resourceUrl) return;
    const resource = new URL(resourceUrl).pathname;
    await storage.recordPayment(resource, address);
    onEvent?.({ type: "payment_recorded", resource, address });
  };
}
function createSIWxRequestHook(options) {
  const { storage, verifyOptions, onEvent } = options;
  const hasUsedNonce = typeof storage.hasUsedNonce === "function";
  const hasRecordNonce = typeof storage.recordNonce === "function";
  if (hasUsedNonce !== hasRecordNonce) {
    throw new Error(
      "SIWxStorage nonce tracking requires both hasUsedNonce and recordNonce to be implemented"
    );
  }
  return async (context) => {
    const header = context.adapter.getHeader(SIGN_IN_WITH_X) || context.adapter.getHeader(SIGN_IN_WITH_X.toLowerCase());
    if (!header) return;
    try {
      const payload = parseSIWxHeader(header);
      const resourceUri = context.adapter.getUrl();
      const validation = await validateSIWxMessage(payload, resourceUri);
      if (!validation.valid) {
        onEvent?.({ type: "validation_failed", resource: context.path, error: validation.error });
        return;
      }
      const verification = await verifySIWxSignature(payload, verifyOptions);
      if (!verification.valid || !verification.address) {
        onEvent?.({ type: "validation_failed", resource: context.path, error: verification.error });
        return;
      }
      if (storage.hasUsedNonce) {
        const nonceUsed = await storage.hasUsedNonce(payload.nonce);
        if (nonceUsed) {
          onEvent?.({ type: "nonce_reused", resource: context.path, nonce: payload.nonce });
          return;
        }
      }
      const hasPaid = await storage.hasPaid(context.path, verification.address);
      if (hasPaid) {
        if (storage.recordNonce) {
          await storage.recordNonce(payload.nonce);
        }
        onEvent?.({
          type: "access_granted",
          resource: context.path,
          address: verification.address
        });
        return { grantAccess: true };
      }
    } catch (err) {
      onEvent?.({
        type: "validation_failed",
        resource: context.path,
        error: err instanceof Error ? err.message : "Unknown error"
      });
    }
  };
}
function createSIWxClientHook(signer) {
  const signerIsSolana = isSolanaSigner(signer);
  const expectedSignatureType = signerIsSolana ? "ed25519" : "eip191";
  return async (context) => {
    const extensions = context.paymentRequired.extensions ?? {};
    const siwxExtension = extensions[SIGN_IN_WITH_X];
    if (!siwxExtension?.supportedChains) return;
    try {
      const matchingChain = siwxExtension.supportedChains.find(
        (chain) => chain.type === expectedSignatureType
      );
      if (!matchingChain) {
        return;
      }
      const completeInfo = {
        ...siwxExtension.info,
        chainId: matchingChain.chainId,
        type: matchingChain.type
      };
      const payload = await createSIWxPayload(completeInfo, signer);
      const header = encodeSIWxHeader(payload);
      return { headers: { [SIGN_IN_WITH_X]: header } };
    } catch {
    }
  };
}

// src/payment-identifier/types.ts
var PAYMENT_IDENTIFIER = "payment-identifier";
var PAYMENT_ID_MIN_LENGTH = 16;
var PAYMENT_ID_MAX_LENGTH = 128;
var PAYMENT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

// src/payment-identifier/schema.ts
var paymentIdentifierSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    required: {
      type: "boolean"
    },
    id: {
      type: "string",
      minLength: PAYMENT_ID_MIN_LENGTH,
      maxLength: PAYMENT_ID_MAX_LENGTH,
      pattern: "^[a-zA-Z0-9_-]+$"
    }
  },
  required: ["required"]
};

// src/payment-identifier/utils.ts
function generatePaymentId(prefix = "pay_") {
  const uuid = crypto.randomUUID().replace(/-/g, "");
  return `${prefix}${uuid}`;
}
function isValidPaymentId(id) {
  if (typeof id !== "string") {
    return false;
  }
  if (id.length < PAYMENT_ID_MIN_LENGTH || id.length > PAYMENT_ID_MAX_LENGTH) {
    return false;
  }
  return PAYMENT_ID_PATTERN.test(id);
}

// src/payment-identifier/validation.ts
var import__2 = __toESM(require("ajv/dist/2020.js"));
function isPaymentIdentifierExtension(extension) {
  if (!extension || typeof extension !== "object") {
    return false;
  }
  const ext = extension;
  if (!ext.info || typeof ext.info !== "object") {
    return false;
  }
  const info = ext.info;
  if (typeof info.required !== "boolean") {
    return false;
  }
  return true;
}
function validatePaymentIdentifier(extension) {
  if (!extension || typeof extension !== "object") {
    return {
      valid: false,
      errors: ["Extension must be an object"]
    };
  }
  const ext = extension;
  if (!ext.info || typeof ext.info !== "object") {
    return {
      valid: false,
      errors: ["Extension must have an 'info' property"]
    };
  }
  const info = ext.info;
  if (typeof info.required !== "boolean") {
    return {
      valid: false,
      errors: ["Extension info must have a 'required' boolean property"]
    };
  }
  if (info.id !== void 0 && typeof info.id !== "string") {
    return {
      valid: false,
      errors: ["Extension info 'id' must be a string if provided"]
    };
  }
  if (info.id !== void 0 && !isValidPaymentId(info.id)) {
    return {
      valid: false,
      errors: [
        `Invalid payment ID format. ID must be 16-128 characters and contain only alphanumeric characters, hyphens, and underscores.`
      ]
    };
  }
  if (ext.schema) {
    try {
      const ajv = new import__2.default({ strict: false, allErrors: true });
      const validate = ajv.compile(ext.schema);
      const valid = validate(ext.info);
      if (!valid && validate.errors) {
        const errors = validate.errors?.map((err) => {
          const path = err.instancePath || "(root)";
          return `${path}: ${err.message}`;
        }) || ["Unknown validation error"];
        return { valid: false, errors };
      }
    } catch (error) {
      return {
        valid: false,
        errors: [
          `Schema validation failed: ${error instanceof Error ? error.message : String(error)}`
        ]
      };
    }
  }
  return { valid: true };
}
function extractPaymentIdentifier(paymentPayload, validate = true) {
  if (!paymentPayload.extensions) {
    return null;
  }
  const extension = paymentPayload.extensions[PAYMENT_IDENTIFIER];
  if (!extension || typeof extension !== "object") {
    return null;
  }
  const ext = extension;
  if (!ext.info || typeof ext.info !== "object") {
    return null;
  }
  const info = ext.info;
  if (typeof info.id !== "string") {
    return null;
  }
  if (validate && !isValidPaymentId(info.id)) {
    return null;
  }
  return info.id;
}
function extractAndValidatePaymentIdentifier(paymentPayload) {
  if (!paymentPayload.extensions) {
    return { id: null, validation: { valid: true } };
  }
  const extension = paymentPayload.extensions[PAYMENT_IDENTIFIER];
  if (!extension) {
    return { id: null, validation: { valid: true } };
  }
  const validation = validatePaymentIdentifier(extension);
  if (!validation.valid) {
    return { id: null, validation };
  }
  const ext = extension;
  return { id: ext.info.id ?? null, validation: { valid: true } };
}
function hasPaymentIdentifier(paymentPayload) {
  return !!(paymentPayload.extensions && paymentPayload.extensions[PAYMENT_IDENTIFIER]);
}
function isPaymentIdentifierRequired(extension) {
  if (!extension || typeof extension !== "object") {
    return false;
  }
  const ext = extension;
  if (!ext.info || typeof ext.info !== "object") {
    return false;
  }
  return ext.info.required === true;
}
function validatePaymentIdentifierRequirement(paymentPayload, serverRequired) {
  if (!serverRequired) {
    return { valid: true };
  }
  const id = extractPaymentIdentifier(paymentPayload, false);
  if (!id) {
    return {
      valid: false,
      errors: ["Server requires a payment identifier but none was provided"]
    };
  }
  if (!isValidPaymentId(id)) {
    return {
      valid: false,
      errors: [
        `Invalid payment ID format. ID must be 16-128 characters and contain only alphanumeric characters, hyphens, and underscores.`
      ]
    };
  }
  return { valid: true };
}

// src/payment-identifier/client.ts
function appendPaymentIdentifierToExtensions(extensions, id) {
  const extension = extensions[PAYMENT_IDENTIFIER];
  if (!isPaymentIdentifierExtension(extension)) {
    return extensions;
  }
  const paymentId = id ?? generatePaymentId();
  if (!isValidPaymentId(paymentId)) {
    throw new Error(
      `Invalid payment ID: "${paymentId}". ID must be 16-128 characters and contain only alphanumeric characters, hyphens, and underscores.`
    );
  }
  extension.info.id = paymentId;
  return extensions;
}

// src/payment-identifier/resourceServer.ts
function declarePaymentIdentifierExtension(required = false) {
  return {
    info: { required },
    schema: paymentIdentifierSchema
  };
}
var paymentIdentifierResourceServerExtension = {
  key: PAYMENT_IDENTIFIER
  // No enrichment needed - the declaration is static
  // Future hooks for idempotency could be added here if needed
};

// src/eip2612-gas-sponsoring/types.ts
var EIP2612_GAS_SPONSORING = { key: "eip2612GasSponsoring" };

// src/eip2612-gas-sponsoring/resourceService.ts
var eip2612GasSponsoringSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    from: {
      type: "string",
      pattern: "^0x[a-fA-F0-9]{40}$",
      description: "The address of the sender."
    },
    asset: {
      type: "string",
      pattern: "^0x[a-fA-F0-9]{40}$",
      description: "The address of the ERC-20 token contract."
    },
    spender: {
      type: "string",
      pattern: "^0x[a-fA-F0-9]{40}$",
      description: "The address of the spender (Canonical Permit2)."
    },
    amount: {
      type: "string",
      pattern: "^[0-9]+$",
      description: "The amount to approve (uint256). Typically MaxUint."
    },
    nonce: {
      type: "string",
      pattern: "^[0-9]+$",
      description: "The current nonce of the sender."
    },
    deadline: {
      type: "string",
      pattern: "^[0-9]+$",
      description: "The timestamp at which the signature expires."
    },
    signature: {
      type: "string",
      pattern: "^0x[a-fA-F0-9]+$",
      description: "The 65-byte concatenated signature (r, s, v) as a hex string."
    },
    version: {
      type: "string",
      pattern: "^[0-9]+(\\.[0-9]+)*$",
      description: "Schema version identifier."
    }
  },
  required: ["from", "asset", "spender", "amount", "nonce", "deadline", "signature", "version"]
};
function declareEip2612GasSponsoringExtension() {
  const key = EIP2612_GAS_SPONSORING.key;
  return {
    [key]: {
      info: {
        description: "The facilitator accepts EIP-2612 gasless Permit to `Permit2` canonical contract.",
        version: "1"
      },
      schema: eip2612GasSponsoringSchema
    }
  };
}

// src/eip2612-gas-sponsoring/facilitator.ts
function extractEip2612GasSponsoringInfo(paymentPayload) {
  if (!paymentPayload.extensions) {
    return null;
  }
  const extension = paymentPayload.extensions[EIP2612_GAS_SPONSORING.key];
  if (!extension?.info) {
    return null;
  }
  const info = extension.info;
  if (!info.from || !info.asset || !info.spender || !info.amount || !info.nonce || !info.deadline || !info.signature || !info.version) {
    return null;
  }
  return info;
}
function validateEip2612GasSponsoringInfo(info) {
  const addressPattern = /^0x[a-fA-F0-9]{40}$/;
  const numericPattern = /^[0-9]+$/;
  const hexPattern = /^0x[a-fA-F0-9]+$/;
  const versionPattern = /^[0-9]+(\.[0-9]+)*$/;
  return addressPattern.test(info.from) && addressPattern.test(info.asset) && addressPattern.test(info.spender) && numericPattern.test(info.amount) && numericPattern.test(info.nonce) && numericPattern.test(info.deadline) && hexPattern.test(info.signature) && versionPattern.test(info.version);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BAZAAR,
  EIP2612_GAS_SPONSORING,
  InMemorySIWxStorage,
  PAYMENT_IDENTIFIER,
  PAYMENT_ID_MAX_LENGTH,
  PAYMENT_ID_MIN_LENGTH,
  PAYMENT_ID_PATTERN,
  SIGN_IN_WITH_X,
  SIWxPayloadSchema,
  SOLANA_DEVNET,
  SOLANA_MAINNET,
  SOLANA_TESTNET,
  appendPaymentIdentifierToExtensions,
  bazaarResourceServerExtension,
  buildSIWxSchema,
  createSIWxClientHook,
  createSIWxMessage,
  createSIWxPayload,
  createSIWxRequestHook,
  createSIWxSettleHook,
  declareDiscoveryExtension,
  declareEip2612GasSponsoringExtension,
  declarePaymentIdentifierExtension,
  declareSIWxExtension,
  decodeBase58,
  encodeBase58,
  encodeSIWxHeader,
  extractAndValidatePaymentIdentifier,
  extractDiscoveryInfo,
  extractDiscoveryInfoFromExtension,
  extractDiscoveryInfoV1,
  extractEVMChainId,
  extractEip2612GasSponsoringInfo,
  extractPaymentIdentifier,
  extractResourceMetadataV1,
  extractSolanaChainReference,
  formatSIWEMessage,
  formatSIWSMessage,
  generatePaymentId,
  getEVMAddress,
  getSolanaAddress,
  hasPaymentIdentifier,
  isBodyExtensionConfig,
  isDiscoverableV1,
  isEVMSigner,
  isMcpExtensionConfig,
  isPaymentIdentifierExtension,
  isPaymentIdentifierRequired,
  isQueryExtensionConfig,
  isSolanaSigner,
  isValidPaymentId,
  parseSIWxHeader,
  paymentIdentifierResourceServerExtension,
  paymentIdentifierSchema,
  signEVMMessage,
  signSolanaMessage,
  siwxResourceServerExtension,
  validateAndExtract,
  validateDiscoveryExtension,
  validateEip2612GasSponsoringInfo,
  validatePaymentIdentifier,
  validatePaymentIdentifierRequirement,
  validateSIWxMessage,
  verifyEVMSignature,
  verifySIWxSignature,
  verifySolanaSignature,
  withBazaar,
  wrapFetchWithSIWx
});
//# sourceMappingURL=index.js.map