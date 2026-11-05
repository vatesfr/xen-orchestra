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
import { forbiddenOperation, incorrectState } from 'xo-common/api-errors.js'
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
import { assertNoUnknownProperties, obfuscatePluginSecrets } from './plugin.helper.mjs'
import { OBFUSCATED_VALUE } from '@vates/obfuscate'

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
  async getAllCollectionObjects(): Promise<XoPlugin[]> {
    return (await this.restApi.xoApp.getPlugins()).map(obfuscatePluginSecrets)
  }
  async getCollectionObject(id: XoPlugin['id']): Promise<XoPlugin> {
    return obfuscatePluginSecrets(await this.restApi.xoApp.getPlugin(id))
  }

  #assertState(plugin: XoPlugin, property: 'configured' | 'loaded' | 'loading', expected: boolean) {
    const actual = plugin[property] === true
    if (actual !== expected) {
      throw incorrectState({ actual, expected, object: plugin.id, property })
    }
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
   * - resource: plugin, action: update:configuration
   *
   * Properties not declared in the `configurationSchema` are rejected.
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
      action: 'update:configuration',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getPlugin,
    }),
  ])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async configurePlugin(@Path() id: string, @Body() body: PluginConfigurationRequestBody): Promise<void> {
    const plugin = await this.getObject(id as XoPlugin['id'])

    assertNoUnknownProperties(body, plugin.configurationSchema)
    await this.restApi.xoApp.configurePlugin(plugin.id, body)
  }

  /**
   * Required privilege:
   * - resource: plugin, action: update:configuration
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
      action: 'update:configuration',
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

    this.#assertState(plugin, 'loaded', false)

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
  @Response(incorrectStateResp.status, 'The plugin is already loaded, is loading or is not configured')
  async loadPlugin(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const plugin = await this.getObject(id as XoPlugin['id'])

    return this.createAction<void>(
      async () => {
        this.#assertState(plugin, 'loaded', false)
        this.#assertState(plugin, 'loading', false)
        this.#assertState(plugin, 'configured', true)
        await this.restApi.xoApp.loadPlugin(plugin.id)
      },
      {
        statusCode: noContentResp.status,
        sync,
        taskProperties: { name: `load ${plugin.name} plugin`, objectId: plugin.id },
      }
    )
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
  @Response(incorrectStateResp.status, 'The plugin is not loaded')
  async unloadPlugin(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const plugin = await this.getObject(id as XoPlugin['id'])

    return this.createAction<void>(
      async () => {
        if (!plugin.unloadable) {
          throw forbiddenOperation('unload plugin', 'the plugin cannot be unloaded')
        }
        this.#assertState(plugin, 'loaded', true)
        await this.restApi.xoApp.unloadPlugin(plugin.id)
      },
      {
        statusCode: noContentResp.status,
        sync,
        taskProperties: { name: `unload ${plugin.name} plugin`, objectId: plugin.id },
      }
    )
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
  @Response(incorrectStateResp.status, 'The plugin is not loaded')
  @Response(invalidParameters.status, 'The data are invalid')
  async testPlugin(
    @Path() id: string,
    @Body() body: PluginTestRequestBody,
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const plugin = await this.getObject(id as XoPlugin['id'])

    assertNoUnknownProperties(body.data, 'testSchema' in plugin ? plugin.testSchema : undefined)

    const params =
      body.data !== undefined && 'password' in body.data ? { ...body.data, password: OBFUSCATED_VALUE } : body.data

    return this.createAction<void>(
      async () => {
        if (!plugin.testable) {
          throw forbiddenOperation('test plugin', 'the plugin is not testable')
        }
        this.#assertState(plugin, 'loaded', true)
        await this.restApi.xoApp.testPlugin(plugin.id, body.data)
      },
      {
        statusCode: noContentResp.status,
        sync,
        taskProperties: { name: `test ${plugin.name} plugin`, objectId: plugin.id, params },
      }
    )
  }
}
