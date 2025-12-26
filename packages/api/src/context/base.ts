/**
 * Base context creation - no external dependencies
 * This provides the minimal context that works without auth
 */

export type BaseContext = {
  headers: Headers;
  session: null;
};

export const createBaseContext = (headers: Headers): BaseContext => ({
  headers,
  session: null,
});

