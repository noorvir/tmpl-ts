import { oc } from "@orpc/contract";
import { z } from "zod";

// @module auth
export const sessionSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
});

export type Session = z.infer<typeof sessionSchema>;

// @end-module
/** The API contract. Clients import it with no server code. */
export const contract = {
  health: {
    check: oc
      .route({ method: "GET", path: "/health", tags: ["system"] })
      .output(
        z.object({
          status: z.literal("ok"),
          timestamp: z.string(),
        }),
      ),
  },
  greeting: {
    create: oc
      .route({ method: "POST", path: "/greeting", tags: ["example"] })
      .input(z.object({ name: z.string().min(1) }))
      .output(z.object({ message: z.string() })),
  },
  // @module auth
  auth: {
    getSession: oc
      .route({ method: "GET", path: "/auth/session", tags: ["auth"] })
      .output(sessionSchema.nullable()),
  },
  // @end-module
};
