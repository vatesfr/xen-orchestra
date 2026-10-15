import {
  Body,
  Delete,
  Example,
  Extension,
  Get,
  Middlewares,
  Patch,
  Path,
  Post,
  Put,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { inject } from 'inversify'
import { json, type Request as ExRequest } from 'express'
import { provide } from 'inversify-binding-decorators'
import type { XoPlugin } from '@vates/types'

import {
  asynchronousActionResp,
  badRequestResp,
  forbiddenOperationResp,
  invalidParameters,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { partialPlugins, plugin, pluginIds } from '../open-api/oa-examples/plugin.oa-example.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import type { PluginConfigurationRequestBody, PluginTestRequestBody, UpdatePluginRequestBody } from './plugin.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

@Route('plugins')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
@Tags('plugins')
@provide(PluginController)
export class PluginController extends XoController<XoPlugin> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('plugin', restApi)
  }

  // --- abstract methods
  getAllCollectionObjects(): Promise<XoPlugin[]> {
    return this.restApi.xoApp.getPlugins()
  }
  getCollectionObject(id: XoPlugin['id']): Promise<XoPlugin> {
    return this.restApi.xoApp.getPlugin(id)
  }

  /**
   * Restricted to administrators.
   *
   * @example fields "id,name,loaded,autoload"
   * @example filter "loaded?"
   * @example limit 42
   */
  @Example(pluginIds)
  @Example(partialPlugins)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  async getPlugins(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoPlugin>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter })), req, { limit })
  }

  /**
   * Restricted to administrators.
   *
   * @example id "transport-email"
   */
  @Example(plugin)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getPlugin(@Path() id: string): Promise<Unbrand<XoPlugin>> {
    return this.getObject(id as XoPlugin['id'])
  }

  /**
   * Restricted to administrators.
   *
   * `autoload`: whether the plugin is loaded when XO starts
   *
   * @example id "transport-email"
   * @example body { "autoload": true }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('{id}')
  @Middlewares(json())
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async updatePlugin(@Path() id: string, @Body() body: UpdatePluginRequestBody): Promise<void> {
    const pluginId = id as XoPlugin['id']
    const { autoload } = body

    // ensure the plugin exists even if there is nothing to update
    await this.getObject(pluginId)

    if (autoload !== undefined) {
      await (autoload
        ? this.restApi.xoApp.enablePluginAutoload(pluginId)
        : this.restApi.xoApp.disablePluginAutoload(pluginId))
    }
  }

  /**
   * Restricted to administrators.
   *
   * Validate the configuration against the plugin `configurationSchema`, apply it and save it.
   *
   * Obfuscated values (e.g. `"* obfuscated *"`) are replaced by the currently saved values.
   *
   * @example id "transport-email"
   * @example body {
   *   "from": { "address": "xo@example.org" },
   *   "transport": { "host": "smtp.example.org", "port": 587 }
   * }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Put('{id}/configuration')
  @Middlewares(json())
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async configurePlugin(@Path() id: string, @Body() body: PluginConfigurationRequestBody): Promise<void> {
    await this.restApi.xoApp.configurePlugin(id as XoPlugin['id'], body)
  }

  /**
   * Restricted to administrators.
   *
   * Unload the plugin and remove its configuration.
   *
   * @example id "transport-email"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}/configuration')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deletePluginConfiguration(@Path() id: string): Promise<void> {
    const pluginId = id as XoPlugin['id']

    await this.getObject(pluginId)
    await this.restApi.xoApp.purgePluginConfiguration(pluginId)
  }

  /**
   * Restricted to administrators.
   *
   * @example id "transport-email"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/load')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, 'The plugin is already loaded, is loading or is not configured')
  loadPlugin(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const pluginId = id as XoPlugin['id']

    return this.createAction<void>(() => this.restApi.xoApp.loadPlugin(pluginId), {
      statusCode: noContentResp.status,
      sync,
      taskProperties: { name: 'load plugin', objectId: pluginId },
    })
  }

  /**
   * Restricted to administrators.
   *
   * @example id "transport-email"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/unload')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, 'The plugin is already unloaded or cannot be unloaded')
  unloadPlugin(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const pluginId = id as XoPlugin['id']

    return this.createAction<void>(() => this.restApi.xoApp.unloadPlugin(pluginId), {
      statusCode: noContentResp.status,
      sync,
      taskProperties: { name: 'unload plugin', objectId: pluginId },
    })
  }

  /**
   * Restricted to administrators.
   *
   * Test the plugin with its current configuration. The plugin must be loaded.
   *
   * `data` must match the plugin `testSchema`, if any.
   *
   * @example id "transport-email"
   * @example body { "data": { "to": "admin@example.org" } }
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/test')
  @Middlewares(json())
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, 'The plugin is not testable, not loaded or the data are invalid')
  testPlugin(
    @Path() id: string,
    @Body() body: PluginTestRequestBody,
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const pluginId = id as XoPlugin['id']

    return this.createAction<void>(() => this.restApi.xoApp.testPlugin(pluginId, body.data), {
      statusCode: noContentResp.status,
      sync,
      taskProperties: { name: 'test plugin', objectId: pluginId, params: body },
    })
  }
}
