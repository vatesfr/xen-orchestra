import { Get, Query, Route, Security, Tags, Response, SuccessResponse, Example, Path } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { RestApi } from '../rest-api/rest-api.mjs'
import { ServerConfigService } from './server-config.service.mjs'
import {
  notFoundResp,
  unauthorizedResp,
  badRequestResp,
  forbiddenOperationResp,
  asynchronousActionResp,
} from '../open-api/common/response.common.mjs'
import type { ConfigContent, ConfigSource } from './server-config.type.mjs'
import { mergedConfigExample, sourcesExample, sourceFileExample } from './server-config.oa-example.mjs'

@Route('server-config')
@Security('*') // admin-only: no acl() middleware → only permission==='admin' passes
@Tags('server-config')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@provide(ServerConfigController)
export class ServerConfigController {
  #service: ServerConfigService

  constructor(@inject(RestApi) _restApi: RestApi, @inject(ServerConfigService) service: ServerConfigService) {
    this.#service = service
  }

  /**
   * Returns the fully merged runtime configuration.
   * Sensitive fields (passwords, secrets, tokens) are replaced with "**REDACTED**".
   * Unknown configuration keys are omitted.
   */
  @Example(mergedConfigExample)
  @Get('')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getMergedConfig(): ConfigContent {
    return this.#service.getMerged()
  }

  /**
   * if path is undefined:
   * Returns the list of configuration files loaded at startup, grouped by layer.
   * Layers are resolved in order: vendor → system → global → local.
   *
   * if path is defined:
   * Returns the parsed content of a single configuration file.
   * The path must appear in the list returned by GET /server-config/sources.
   * Sensitive fields are redacted. Unknown keys are omitted.
   *
   * @example path "/etc/xo-server/config.toml"
   */
  @Example(sourcesExample)
  @Example(sourceFileExample)
  @Get('sources')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async getSources(@Query() path?: string): Promise<ConfigContent | ConfigSource[]> {
    if (path !== undefined) {
      return this.#service.getSource(path)
    }
    return this.#service.listSources()
  }
}
