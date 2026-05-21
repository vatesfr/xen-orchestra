import type { NextFunction, Request, Response } from 'express'

import { ApiError } from '../helpers/error.helper.mjs'
import { iocContainer } from '../ioc/ioc.mjs'
import { isMcpEnabled, MCP_DISABLED_ERROR, MCP_STATUS_PATH } from '../mcp/mcp.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

// Identifies requests originating from the `@xen-orchestra/mcp` binary.
//
// SECURITY: the header is NOT authenticated — any client can spoof it. Use it
// only to RESTRICT behaviour (e.g. the MCP kill-switch), never to grant
// privileges.
function isMcpRequest(req: Request): boolean {
  // Node lowercases header names; values keep their original case so we
  // normalize before comparing. `Array.isArray` covers the unusual case of
  // a duplicated header value (a malformed or hostile client).
  const header = req.headers['x-xo-client']
  const value = Array.isArray(header) ? header[0] : header
  return typeof value === 'string' && value.toLowerCase() === 'mcp'
}

export function mcpGateMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!isMcpRequest(req)) {
    return next()
  }

  // Always let the kill-switch probe through so the MCP binary can fail-fast.
  if (req.path === MCP_STATUS_PATH) {
    return next()
  }

  if (!isMcpEnabled(iocContainer.get(RestApi))) {
    return next(new ApiError('MCP is disabled by administrator', 403, { data: { error: MCP_DISABLED_ERROR } }))
  }

  next()
}
