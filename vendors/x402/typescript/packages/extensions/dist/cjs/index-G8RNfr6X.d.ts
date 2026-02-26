import { FacilitatorExtension, ResourceServerExtension, PaymentPayload, PaymentRequirements, PaymentRequirementsV1 } from '@x402/core/types';
import { BodyMethods, QueryParamMethods, HTTPFacilitatorClient } from '@x402/core/http';

/**
 * Shared type utilities for x402 extensions
 */
/**
 * Type utility to merge extensions properly when chaining.
 * If T already has extensions, merge them; otherwise add new extensions.
 *
 * @example
 * ```ts
 * // Chaining multiple extensions preserves all types:
 * const client = withBazaar(withOtherExtension(new HTTPFacilitatorClient()));
 * // Type: HTTPFacilitatorClient & { extensions: OtherExtension & BazaarExtension }
 * ```
 */
type WithExtensions<T, E> = T extends {
    extensions: infer Existing;
} ? Omit<T, "extensions"> & {
    extensions: Existing & E;
} : T & {
    extensions: E;
};

/**
 * HTTP-specific type definitions for the Bazaar Discovery Extension
 */

/**
 * Discovery info for query parameter methods (GET, HEAD, DELETE)
 */
interface QueryDiscoveryInfo {
    input: {
        type: "http";
        /** Absent at declaration time; set by bazaarResourceServerExtension.enrichDeclaration */
        method?: QueryParamMethods;
        queryParams?: Record<string, unknown>;
        headers?: Record<string, string>;
    };
    output?: {
        type?: string;
        format?: string;
        example?: unknown;
    };
}
/**
 * Discovery info for body methods (POST, PUT, PATCH)
 */
interface BodyDiscoveryInfo {
    input: {
        type: "http";
        /** Absent at declaration time; set by bazaarResourceServerExtension.enrichDeclaration */
        method?: BodyMethods;
        bodyType: "json" | "form-data" | "text";
        body: Record<string, unknown>;
        queryParams?: Record<string, unknown>;
        headers?: Record<string, string>;
    };
    output?: {
        type?: string;
        format?: string;
        example?: unknown;
    };
}
/**
 * Discovery extension for query parameter methods (GET, HEAD, DELETE)
 */
interface QueryDiscoveryExtension {
    info: QueryDiscoveryInfo;
    schema: {
        $schema: "https://json-schema.org/draft/2020-12/schema";
        type: "object";
        properties: {
            input: {
                type: "object";
                properties: {
                    type: {
                        type: "string";
                        const: "http";
                    };
                    method: {
                        type: "string";
                        enum: QueryParamMethods[];
                    };
                    queryParams?: {
                        type: "object";
                        properties?: Record<string, unknown>;
                        required?: string[];
                        additionalProperties?: boolean;
                    };
                    headers?: {
                        type: "object";
                        additionalProperties: {
                            type: "string";
                        };
                    };
                };
                required: ("type" | "method")[];
                additionalProperties?: boolean;
            };
            output?: {
                type: "object";
                properties?: Record<string, unknown>;
                required?: readonly string[];
                additionalProperties?: boolean;
            };
        };
        required: ["input"];
    };
}
/**
 * Discovery extension for body methods (POST, PUT, PATCH)
 */
interface BodyDiscoveryExtension {
    info: BodyDiscoveryInfo;
    schema: {
        $schema: "https://json-schema.org/draft/2020-12/schema";
        type: "object";
        properties: {
            input: {
                type: "object";
                properties: {
                    type: {
                        type: "string";
                        const: "http";
                    };
                    method: {
                        type: "string";
                        enum: BodyMethods[];
                    };
                    bodyType: {
                        type: "string";
                        enum: ["json", "form-data", "text"];
                    };
                    body: Record<string, unknown>;
                    queryParams?: {
                        type: "object";
                        properties?: Record<string, unknown>;
                        required?: string[];
                        additionalProperties?: boolean;
                    };
                    headers?: {
                        type: "object";
                        additionalProperties: {
                            type: "string";
                        };
                    };
                };
                required: ("type" | "method" | "bodyType" | "body")[];
                additionalProperties?: boolean;
            };
            output?: {
                type: "object";
                properties?: Record<string, unknown>;
                required?: readonly string[];
                additionalProperties?: boolean;
            };
        };
        required: ["input"];
    };
}
interface DeclareQueryDiscoveryExtensionConfig {
    method?: QueryParamMethods;
    input?: Record<string, unknown>;
    inputSchema?: Record<string, unknown>;
    output?: {
        example?: unknown;
        schema?: Record<string, unknown>;
    };
}
interface DeclareBodyDiscoveryExtensionConfig {
    method?: BodyMethods;
    input?: Record<string, unknown>;
    inputSchema?: Record<string, unknown>;
    bodyType: "json" | "form-data" | "text";
    output?: {
        example?: unknown;
        schema?: Record<string, unknown>;
    };
}
interface DiscoveredHTTPResource {
    resourceUrl: string;
    description?: string;
    mimeType?: string;
    /** Present after server extension enrichment; may be absent for pre-enrichment data */
    method?: string;
    x402Version: number;
    discoveryInfo: DiscoveryInfo;
}
declare const isQueryExtensionConfig: (config: DeclareQueryDiscoveryExtensionConfig | DeclareBodyDiscoveryExtensionConfig) => config is DeclareQueryDiscoveryExtensionConfig;
declare const isBodyExtensionConfig: (config: DeclareQueryDiscoveryExtensionConfig | DeclareBodyDiscoveryExtensionConfig) => config is DeclareBodyDiscoveryExtensionConfig;

/**
 * MCP-specific type definitions for the Bazaar Discovery Extension
 */

/**
 * Discovery info for MCP tools
 */
interface McpDiscoveryInfo {
    input: {
        type: "mcp";
        toolName: string;
        description?: string;
        transport?: "streamable-http" | "sse";
        inputSchema: Record<string, unknown>;
        example?: Record<string, unknown>;
    };
    output?: {
        type?: string;
        format?: string;
        example?: unknown;
    };
}
/**
 * Discovery extension for MCP tools
 */
interface McpDiscoveryExtension {
    info: McpDiscoveryInfo;
    schema: {
        $schema: "https://json-schema.org/draft/2020-12/schema";
        type: "object";
        properties: {
            input: {
                type: "object";
                properties: {
                    type: {
                        type: "string";
                        const: "mcp";
                    };
                    toolName: {
                        type: "string";
                    };
                    description?: {
                        type: "string";
                    };
                    transport?: {
                        type: "string";
                        enum: ["streamable-http", "sse"];
                    };
                    inputSchema: Record<string, unknown>;
                    example?: Record<string, unknown>;
                };
                required: ("type" | "toolName" | "inputSchema")[];
                additionalProperties?: boolean;
            };
            output?: {
                type: "object";
                properties?: Record<string, unknown>;
                required?: readonly string[];
                additionalProperties?: boolean;
            };
        };
        required: ["input"];
    };
}
interface DeclareMcpDiscoveryExtensionConfig {
    toolName: string;
    description?: string;
    transport?: "streamable-http" | "sse";
    inputSchema: Record<string, unknown>;
    example?: Record<string, unknown>;
    output?: {
        example?: unknown;
        schema?: Record<string, unknown>;
    };
}
interface DiscoveredMCPResource {
    resourceUrl: string;
    description?: string;
    mimeType?: string;
    toolName: string;
    x402Version: number;
    discoveryInfo: DiscoveryInfo;
}
declare const isMcpExtensionConfig: (config: DeclareMcpDiscoveryExtensionConfig | Record<string, unknown>) => config is DeclareMcpDiscoveryExtensionConfig;

/**
 * Shared type definitions for the Bazaar Discovery Extension
 *
 * Protocol-specific types live in their own directories (http/, mcp/).
 * This file defines the shared unions, constants, and utility types,
 * and re-exports all protocol-specific types for backwards compatibility.
 */

/**
 * Extension identifier for the Bazaar discovery extension.
 */
declare const BAZAAR: FacilitatorExtension;
/**
 * Combined discovery info type
 */
type DiscoveryInfo = QueryDiscoveryInfo | BodyDiscoveryInfo | McpDiscoveryInfo;
/**
 * Combined discovery extension type
 */
type DiscoveryExtension = QueryDiscoveryExtension | BodyDiscoveryExtension | McpDiscoveryExtension;
type DeclareDiscoveryExtensionConfig = DeclareQueryDiscoveryExtensionConfig | DeclareBodyDiscoveryExtensionConfig | DeclareMcpDiscoveryExtensionConfig;
/**
 * Distributive Omit - properly distributes Omit over union types.
 *
 * Standard `Omit<A | B, K>` collapses to common properties only,
 * losing discriminant properties like `bodyType`.
 *
 * This type uses conditional type distribution to preserve the union:
 * `DistributiveOmit<A | B, K>` = `Omit<A, K> | Omit<B, K>`
 */
type DistributiveOmit<T, K extends keyof T> = T extends T ? Omit<T, K> : never;
/**
 * Config type for declareDiscoveryExtension function.
 * Uses DistributiveOmit to preserve bodyType discriminant in the union for HTTP configs.
 * MCP config has no `method` field so it's included directly.
 */
type DeclareDiscoveryExtensionInput = DistributiveOmit<DeclareQueryDiscoveryExtensionConfig, "method"> | DistributiveOmit<DeclareBodyDiscoveryExtensionConfig, "method"> | DeclareMcpDiscoveryExtensionConfig;

/**
 * Resource Service entry point for creating Bazaar discovery extensions
 *
 * This module provides the unified `declareDiscoveryExtension` function that
 * routes to protocol-specific builders in http/ and mcp/.
 */

/**
 * Create a discovery extension for any HTTP method or MCP tool
 *
 * This function helps servers declare how their endpoint should be called,
 * including the expected input parameters/body and output format.
 *
 * @param config - Configuration object for the discovery extension
 * @returns A discovery extension object with both info and schema
 *
 * @example
 * ```typescript
 * // For a GET endpoint with no input
 * const getExtension = declareDiscoveryExtension({
 *   method: "GET",
 *   output: {
 *     example: { message: "Success", timestamp: "2024-01-01T00:00:00Z" }
 *   }
 * });
 *
 * // For a GET endpoint with query params
 * const getWithParams = declareDiscoveryExtension({
 *   method: "GET",
 *   input: { query: "example" },
 *   inputSchema: {
 *     properties: {
 *       query: { type: "string" }
 *     },
 *     required: ["query"]
 *   }
 * });
 *
 * // For a POST endpoint with JSON body
 * const postExtension = declareDiscoveryExtension({
 *   method: "POST",
 *   input: { name: "John", age: 30 },
 *   inputSchema: {
 *     properties: {
 *       name: { type: "string" },
 *       age: { type: "number" }
 *     },
 *     required: ["name"]
 *   },
 *   bodyType: "json",
 *   output: {
 *     example: { success: true, id: "123" }
 *   }
 * });
 *
 * // For an MCP tool
 * const mcpExtension = declareDiscoveryExtension({
 *   toolName: "financial_analysis",
 *   description: "Analyze financial data for a given ticker",
 *   inputSchema: {
 *     type: "object",
 *     properties: {
 *       ticker: { type: "string" },
 *     },
 *     required: ["ticker"],
 *   },
 *   output: {
 *     example: { pe_ratio: 28.5, recommendation: "hold" }
 *   }
 * });
 * ```
 */
declare function declareDiscoveryExtension(config: DeclareDiscoveryExtensionInput): Record<string, DiscoveryExtension>;

declare const bazaarResourceServerExtension: ResourceServerExtension;

/**
 * Facilitator functions for validating and extracting Bazaar discovery extensions
 *
 * These functions help facilitators validate extension data against schemas
 * and extract the discovery information for cataloging in the Bazaar.
 *
 * Supports both v2 (extensions in PaymentRequired) and v1 (outputSchema in PaymentRequirements).
 */

/**
 * Validation result for discovery extensions
 */
interface ValidationResult {
    valid: boolean;
    errors?: string[];
}
/**
 * Validates a discovery extension's info against its schema
 *
 * @param extension - The discovery extension containing info and schema
 * @returns Validation result indicating if the info matches the schema
 *
 * @example
 * ```typescript
 * const extension = declareDiscoveryExtension(...);
 * const result = validateDiscoveryExtension(extension);
 *
 * if (result.valid) {
 *   console.log("Extension is valid");
 * } else {
 *   console.error("Validation errors:", result.errors);
 * }
 * ```
 */
declare function validateDiscoveryExtension(extension: DiscoveryExtension): ValidationResult;

type DiscoveredResource = DiscoveredHTTPResource | DiscoveredMCPResource;
/**
 * Extracts discovery information from payment payload and requirements.
 * Combines resource URL, HTTP method, version, and discovery info into a single object.
 *
 * @param paymentPayload - The payment payload containing extensions and resource info
 * @param paymentRequirements - The payment requirements to validate against
 * @param validate - Whether to validate the discovery info against the schema (default: true)
 * @returns Discovered resource info with URL, method, version and discovery data, or null if not found
 */
declare function extractDiscoveryInfo(paymentPayload: PaymentPayload, paymentRequirements: PaymentRequirements | PaymentRequirementsV1, validate?: boolean): DiscoveredResource | null;
/**
 * Extracts discovery info from a v2 extension directly
 *
 * This is a lower-level function for when you already have the extension object.
 * For general use, prefer the main extractDiscoveryInfo function.
 *
 * @param extension - The discovery extension to extract info from
 * @param validate - Whether to validate before extracting (default: true)
 * @returns The discovery info if valid
 * @throws Error if validation fails and validate is true
 */
declare function extractDiscoveryInfoFromExtension(extension: DiscoveryExtension, validate?: boolean): DiscoveryInfo;
/**
 * Validates and extracts discovery info in one step
 *
 * This is a convenience function that combines validation and extraction,
 * returning both the validation result and the info if valid.
 *
 * @param extension - The discovery extension to validate and extract
 * @returns Object containing validation result and info (if valid)
 *
 * @example
 * ```typescript
 * const extension = declareDiscoveryExtension(...);
 * const { valid, info, errors } = validateAndExtract(extension);
 *
 * if (valid && info) {
 *   // Store info in Bazaar catalog
 * } else {
 *   console.error("Validation errors:", errors);
 * }
 * ```
 */
declare function validateAndExtract(extension: DiscoveryExtension): {
    valid: boolean;
    info?: DiscoveryInfo;
    errors?: string[];
};

/**
 * V1 Facilitator functions for extracting Bazaar discovery information
 *
 * In v1, discovery information is stored in the `outputSchema` field
 * of PaymentRequirements, which has a different structure than v2.
 *
 * This module transforms v1 data into v2 DiscoveryInfo format.
 */

/**
 * Extracts discovery info from v1 PaymentRequirements and transforms to v2 format
 *
 * In v1, the discovery information is stored in the `outputSchema` field,
 * which contains both input (endpoint shape) and output (response schema) information.
 *
 * This function makes smart assumptions to normalize v1 data into v2 DiscoveryInfo format:
 * - For GET/HEAD/DELETE: Looks for queryParams, query, or params fields
 * - For POST/PUT/PATCH: Looks for bodyFields, body, or data fields and normalizes bodyType
 * - Extracts optional headers if present
 *
 * @param paymentRequirements - V1 payment requirements
 * @returns Discovery info in v2 format if present and valid, or null if not discoverable
 *
 * @example
 * ```typescript
 * const requirements: PaymentRequirementsV1 = {
 *   scheme: "exact",
 *   network: "eip155:8453",
 *   maxAmountRequired: "100000",
 *   resource: "https://api.example.com/data",
 *   description: "Get data",
 *   mimeType: "application/json",
 *   outputSchema: {
 *     input: {
 *       type: "http",
 *       method: "GET",
 *       discoverable: true,
 *       queryParams: { query: "string" }
 *     },
 *     output: { type: "object" }
 *   },
 *   payTo: "0x...",
 *   maxTimeoutSeconds: 300,
 *   asset: "0x...",
 *   extra: {}
 * };
 *
 * const info = extractDiscoveryInfoV1(requirements);
 * if (info) {
 *   console.log("Endpoint method:", info.input.method);
 * }
 * ```
 */
declare function extractDiscoveryInfoV1(paymentRequirements: PaymentRequirementsV1): DiscoveryInfo | null;
/**
 * Checks if v1 PaymentRequirements contains discoverable information
 *
 * @param paymentRequirements - V1 payment requirements
 * @returns True if the requirements contain valid discovery info
 *
 * @example
 * ```typescript
 * if (isDiscoverableV1(requirements)) {
 *   const info = extractDiscoveryInfoV1(requirements);
 *   // Catalog info in Bazaar
 * }
 * ```
 */
declare function isDiscoverableV1(paymentRequirements: PaymentRequirementsV1): boolean;
/**
 * Extracts resource metadata from v1 PaymentRequirements
 *
 * In v1, resource information is embedded directly in the payment requirements
 * rather than in a separate resource object.
 *
 * @param paymentRequirements - V1 payment requirements
 * @returns Resource metadata
 *
 * @example
 * ```typescript
 * const metadata = extractResourceMetadataV1(requirements);
 * console.log("Resource URL:", metadata.url);
 * console.log("Description:", metadata.description);
 * ```
 */
declare function extractResourceMetadataV1(paymentRequirements: PaymentRequirementsV1): {
    url: string;
    description: string;
    mimeType: string;
};

/**
 * Client extensions for querying Bazaar discovery resources
 */

/**
 * Parameters for listing discovery resources.
 * All parameters are optional and used for filtering/pagination.
 */
interface ListDiscoveryResourcesParams {
    /**
     * Filter by protocol type (e.g., "http", "mcp").
     */
    type?: string;
    /**
     * The number of discovered x402 resources to return per page.
     */
    limit?: number;
    /**
     * The offset of the first discovered x402 resource to return.
     */
    offset?: number;
}
/**
 * A discovered x402 resource from the bazaar.
 */
interface DiscoveryResource {
    /** The URL or identifier of the discovered resource */
    resource: string;
    /** The protocol type of the resource (e.g., "http") */
    type: string;
    /** The x402 protocol version supported by this resource */
    x402Version: number;
    /** Array of accepted payment methods for this resource */
    accepts: PaymentRequirements[];
    /** ISO 8601 timestamp of when the resource was last updated */
    lastUpdated: string;
    /** Additional metadata about the resource */
    metadata?: Record<string, unknown>;
}
/**
 * Response from listing discovery resources.
 */
interface DiscoveryResourcesResponse {
    /** The x402 protocol version of this response */
    x402Version: number;
    /** The list of discovered resources */
    items: DiscoveryResource[];
    /** Pagination information for the response */
    pagination: {
        /** Maximum number of results returned */
        limit: number;
        /** Number of results skipped */
        offset: number;
        /** Total count of resources matching the query */
        total: number;
    };
}
/**
 * Bazaar client extension interface providing discovery query functionality.
 */
interface BazaarClientExtension {
    discovery: {
        /**
         * List x402 discovery resources from the bazaar.
         *
         * @param params - Optional filtering and pagination parameters
         * @returns A promise resolving to the discovery resources response
         */
        listResources(params?: ListDiscoveryResourcesParams): Promise<DiscoveryResourcesResponse>;
    };
}
/**
 * Extends a facilitator client with Bazaar discovery query functionality.
 * Preserves and merges with any existing extensions from prior chaining.
 *
 * @param client - The facilitator client to extend
 * @returns The client extended with bazaar discovery capabilities
 *
 * @example
 * ```ts
 * // Basic usage
 * const client = withBazaar(new HTTPFacilitatorClient());
 * const resources = await client.extensions.discovery.listResources({ type: "http" });
 *
 * // Chaining with other extensions
 * const client = withBazaar(withOtherExtension(new HTTPFacilitatorClient()));
 * await client.extensions.other.someMethod();
 * await client.extensions.discovery.listResources();
 * ```
 */
declare function withBazaar<T extends HTTPFacilitatorClient>(client: T): WithExtensions<T, BazaarClientExtension>;

export { validateAndExtract as A, BAZAAR as B, validateDiscoveryExtension as C, type DeclareBodyDiscoveryExtensionConfig as D, withBazaar as E, type ListDiscoveryResourcesParams as L, type McpDiscoveryExtension as M, type QueryDiscoveryExtension as Q, type ValidationResult as V, type WithExtensions as W, type BazaarClientExtension as a, type BodyDiscoveryExtension as b, type BodyDiscoveryInfo as c, type DeclareDiscoveryExtensionConfig as d, type DeclareDiscoveryExtensionInput as e, type DeclareMcpDiscoveryExtensionConfig as f, type DeclareQueryDiscoveryExtensionConfig as g, type DiscoveredHTTPResource as h, type DiscoveredMCPResource as i, type DiscoveredResource as j, type DiscoveryExtension as k, type DiscoveryInfo as l, type DiscoveryResource as m, type DiscoveryResourcesResponse as n, type McpDiscoveryInfo as o, type QueryDiscoveryInfo as p, bazaarResourceServerExtension as q, declareDiscoveryExtension as r, extractDiscoveryInfo as s, extractDiscoveryInfoFromExtension as t, extractDiscoveryInfoV1 as u, extractResourceMetadataV1 as v, isBodyExtensionConfig as w, isDiscoverableV1 as x, isMcpExtensionConfig as y, isQueryExtensionConfig as z };
