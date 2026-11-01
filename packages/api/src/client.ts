import type { ContractRouterClient } from "@orpc/contract";
import type { JsonifiedClient } from "@orpc/openapi-client";
import { createORPCClient } from "@orpc/client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";

import { contract } from "./contract.ts";

export type ApiClient = JsonifiedClient<
  ContractRouterClient<typeof contract>
>;

/** Returns a typed client for the API server at `url`. */
export function createApiClient(args: {
  url: string;
  headers?: Record<string, string>;
}): ApiClient {
  const { url, headers = {} } = args;
  const link = new OpenAPILink(contract, { url, headers });

  return createORPCClient(link);
}
