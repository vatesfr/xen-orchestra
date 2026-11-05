import { Controller, Example, Get, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import { ApiError } from '../helpers/error.helper.mjs'
import { isMcpEnabled, MCP_DISABLED_ERROR } from './mcp.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

const ENABLED_RESPONSE = {
  status: 200,
  description: 'MCP is enabled',
} as const

const DISABLED_RESPONSE = {
  status: 503,
  description: 'MCP is disabled by administrator',
} as const

export type McpStatus = { enabled: true }

@Route('mcp')
@Tags('mcp')
@provide(McpController)
export class McpController extends Controller {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    super()
    this.#restApi = restApi
  }

  /**
   * Returns whether MCP is currently enabled on this XO server.
   *
   * The route is publicly reachable (no authentication required) so the
   * `@xen-orchestra/mcp` binary can check the kill-switch at startup,
   * before any credentials have been configured.
   */
  @Security('none')
  @Example<McpStatus>({ enabled: true })
  @Get('status')
  @SuccessResponse(ENABLED_RESPONSE.status, ENABLED_RESPONSE.description)
  @Response(DISABLED_RESPONSE.status, DISABLED_RESPONSE.description)
  getMcpStatus(): McpStatus {
    if (!isMcpEnabled(this.#restApi)) {
      throw new ApiError(DISABLED_RESPONSE.description, DISABLED_RESPONSE.status, {
        data: { error: MCP_DISABLED_ERROR },
      })
    }
    return { enabled: true }
  }
}
