import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";

import { router } from "./router.ts";

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

export function getOpenApiDocument(args: { serverUrl: string }) {
  const { serverUrl } = args;

  return generator.generate(router, {
    info: { title: "API", version: "0.1.0" },
    servers: [{ url: serverUrl }],
  });
}
