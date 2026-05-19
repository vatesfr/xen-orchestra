import { Controller, Example, Get, Response, Route, Security, Tags } from 'tsoa'
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
@provide(McpStatusController)
export class McpStatusController extends Controller {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    super()
    this.#restApi = restApi
  }

  /**
   * Returns the global MCP kill-switch status.
   *
   * The route is anonymous (`@Security('none')`) so the `@xen-orchestra/mcp`
   * binary can probe it before authentication is established at startup.
   */
  @Security('none')
  @Example<McpStatus>({ enabled: true })
  @Get('status')
  @Response(ENABLED_RESPONSE.status, ENABLED_RESPONSE.description)
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
