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
import { incorrectState } from 'xo-common/api-errors.js'
import { json, type Request as ExRequest } from 'express'
import { provide } from 'inversify-binding-decorators'
import type { XoPlugin } from '@vates/types'

import {
  asynchronousActionResp,
  badRequestResp,
  forbiddenOperationResp,
  incorrectStateResp,
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
import { acl, actionsFromBody } from '../middlewares/acl.middleware.mjs'

@Route('plugins')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
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
   * Returns all plugins that match the following privilege:
   * - resource: plugin, action: read
   *
   * @example fields "id,name,loaded,autoload"
   * @example filter "loaded?"
   * @example limit 42
   */
  @Example(pluginIds)
  @Example(partialPlugins)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  async getPlugins(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoPlugin>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'plugin' },
    })
  }

  /**
   * Required privilege:
   * - resource: plugin, action: read
   *
   * @example id "transport-email"
   */
  @Example(plugin)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'plugin',
      action: 'read',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getPlugin,
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getPlugin(@Path() id: string): Promise<Unbrand<XoPlugin>> {
    return this.getObject(id as XoPlugin['id'])
  }

  /**
   * Required privilege per field provided in the body:
   * - resource: plugin, action: update:&lt;field&gt; (e.g. update:autoload)
   *
   * `autoload`: whether the plugin is loaded when XO starts
   *
   * @example id "transport-email"
   * @example body { "autoload": true }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('{id}')
  @Middlewares([
    json(),
    acl({
      resource: 'plugin',
      actions: actionsFromBody(['update:autoload']),
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getPlugin,
    }),
  ])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async updatePlugin(@Path() id: string, @Body() body: UpdatePluginRequestBody): Promise<void> {
    const pluginId = id as XoPlugin['id']
    const { autoload } = body

    if (autoload !== undefined) {
      await (autoload
        ? this.restApi.xoApp.enablePluginAutoload(pluginId)
        : this.restApi.xoApp.disablePluginAutoload(pluginId))
    }
  }

  /**
   * Required privilege:
   * - resource: plugin, action: configure
   *
   * Validate the configuration against the plugin `configurationSchema`, apply it and save it.
   *
   * Obfuscated values (`"obfuscated-q3oi6d9X8uenGvdLnHk2"`) are replaced by the currently saved values.
   *
   * @example id "transport-email"
   * @example body {
   *   "from": { "address": "xo@example.org" },
   *   "transport": { "host": "smtp.example.org", "port": 587 }
   * }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Put('{id}/configuration')
  @Middlewares([
    json(),
    acl({
      resource: 'plugin',
      action: 'configure',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getPlugin,
    }),
  ])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async configurePlugin(@Path() id: string, @Body() body: PluginConfigurationRequestBody): Promise<void> {
    await this.restApi.xoApp.configurePlugin(id as XoPlugin['id'], body)
  }

  /**
   * Required privilege:
   * - resource: plugin, action: delete-configuration
   *
   * Remove the plugin configuration. The plugin must be unloaded.
   *
   * @example id "transport-email"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}/configuration')
  @Middlewares(
    acl({
      resource: 'plugin',
      action: 'delete-configuration',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getPlugin,
    })
  )
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(incorrectStateResp.status, 'The plugin is loaded')
  async deletePluginConfiguration(@Path() id: string): Promise<void> {
    const plugin = await this.getObject(id as XoPlugin['id'])

    if (plugin.loaded) {
      throw incorrectState({ actual: plugin.loaded, expected: false, object: plugin.id, property: 'loaded' })
    }

    await this.restApi.xoApp.purgePluginConfiguration(plugin.id)
  }

  /**
   * Required privilege:
   * - resource: plugin, action: load
   *
   * @example id "transport-email"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/load')
  @Middlewares(
    acl({
      resource: 'plugin',
      action: 'load',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getPlugin,
    })
  )
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, 'The plugin is already loaded, is loading or is not configured')
  async loadPlugin(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const plugin = await this.getObject(id as XoPlugin['id'])

    return this.createAction<void>(() => this.restApi.xoApp.loadPlugin(plugin.id), {
      statusCode: noContentResp.status,
      sync,
      taskProperties: { name: `load ${plugin.name} plugin`, objectId: plugin.id },
    })
  }

  /**
   * Required privilege:
   * - resource: plugin, action: unload
   *
   * @example id "transport-email"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/unload')
  @Middlewares(
    acl({
      resource: 'plugin',
      action: 'unload',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getPlugin,
    })
  )
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, 'The plugin is already unloaded or cannot be unloaded')
  async unloadPlugin(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const plugin = await this.getObject(id as XoPlugin['id'])

    return this.createAction<void>(() => this.restApi.xoApp.unloadPlugin(plugin.id), {
      statusCode: noContentResp.status,
      sync,
      taskProperties: { name: `unload ${plugin.name} plugin`, objectId: plugin.id },
    })
  }

  /**
   * Required privilege:
   * - resource: plugin, action: test
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
  @Middlewares([
    json(),
    acl({
      resource: 'plugin',
      action: 'test',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getPlugin,
    }),
  ])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, 'The plugin is not testable, not loaded or the data are invalid')
  async testPlugin(
    @Path() id: string,
    @Body() body: PluginTestRequestBody,
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const plugin = await this.getObject(id as XoPlugin['id'])

    return this.createAction<void>(() => this.restApi.xoApp.testPlugin(plugin.id, body.data), {
      statusCode: noContentResp.status,
      sync,
      taskProperties: { name: `test ${plugin.name} plugin`, objectId: plugin.id },
    })
  }
}
