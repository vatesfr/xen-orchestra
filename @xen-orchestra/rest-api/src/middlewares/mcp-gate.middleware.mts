import type { NextFunction, Request, Response } from 'express'

import { ApiError } from '../helpers/error.helper.mjs'
import { iocContainer } from '../ioc/ioc.mjs'
import { isMcpEnabled, MCP_DISABLED_ERROR, MCP_STATUS_PATH } from '../mcp/mcp.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

export function mcpGateMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!req.isMcp) {
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
