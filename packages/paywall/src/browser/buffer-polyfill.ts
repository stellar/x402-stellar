// Inject Buffer polyfill
// Necessary for Stellar SDK and wallet libraries in the browser

import { Buffer } from "buffer";

globalThis.Buffer = Buffer;
