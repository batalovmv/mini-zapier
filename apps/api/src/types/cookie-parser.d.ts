declare module 'cookie-parser' {
  import type { IncomingMessage, ServerResponse } from 'node:http';

  interface CookieParser {
    (
      secret?: string | string[],
      options?: unknown,
    ): (
      req: IncomingMessage & { cookies?: Record<string, string> },
      res: ServerResponse,
      next: (error?: unknown) => void,
    ) => void;
  }

  const cookieParser: CookieParser;

  export default cookieParser;
}
