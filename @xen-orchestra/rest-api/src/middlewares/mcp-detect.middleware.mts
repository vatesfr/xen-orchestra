import type { NextFunction, Request, Response } from 'express'

declare module 'express-serve-static-core' {
  interface Request {
    // Set to `true` when the request advertises itself as coming from the
    // `@xen-orchestra/mcp` binary via the `X-XO-Client: mcp` header.
    //
    // SECURITY: this flag is NOT authenticated — any client can spoof the
    // header. Use it only to RESTRICT behaviour (e.g. the MCP kill-switch),
    // never to grant privileges.
    isMcp?: boolean
  }
}

export function mcpDetectMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Node lowercases header names; values keep their original case so we
  // normalize before comparing. `Array.isArray` covers the unusual case of
  // a duplicated header value (a malformed or hostile client).
  const header = req.headers['x-xo-client']
  const value = Array.isArray(header) ? header[0] : header
  if (typeof value === 'string' && value.toLowerCase() === 'mcp') {
    req.isMcp = true
  }
  next()
}
