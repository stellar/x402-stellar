/**
 * Returns a base HTML template for the X402 paywall.
 * This template contains the structure for payment prompts, wallet connection,
 * and transaction details.
 *
 * @returns HTML template string for the paywall.
 */
export function getBaseTemplate(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="icon" href="https://cdn.sanity.io/images/e2r40yh6/production-i18n/d4809d7123ca78f57b05601982932f5cfa62c3ac-32x32.png?w=32&h=32&fm=png" sizes="32x32" />
        <link rel="icon" href="https://cdn.sanity.io/images/e2r40yh6/production-i18n/d4809d7123ca78f57b05601982932f5cfa62c3ac-32x32.png?w=96&h=96&fm=png" sizes="96x96" />
        <link rel="icon" href="https://cdn.sanity.io/images/e2r40yh6/production-i18n/d4809d7123ca78f57b05601982932f5cfa62c3ac-32x32.png?w=192&h=192&fm=png" sizes="192x192" />
    </head>
    <body>
        <div id="root"></div>
    </body>
    </html>
  `;
}
