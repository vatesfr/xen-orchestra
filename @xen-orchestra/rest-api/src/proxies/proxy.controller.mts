import {
  Body,
  Example,
  Extension,
  Get,
  Middlewares,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { inject } from 'inversify'
import { json } from 'express'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import type { XoApp, XoProxy } from '@vates/types'

import { acl } from '../middlewares/acl.middleware.mjs'
import { ApiError } from '../helpers/error.helper.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  forbiddenOperationResp,
  incorrectStateResp,
  internalServerErrorResp,
  noContentResp,
  notFoundResp,
  proxyUnreachableResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import {
  partialProxies,
  proxy,
  proxyHealth,
  proxyIds,
  proxyApplianceUpdaterState,
} from '../open-api/oa-examples/proxy.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

function isProxyUnreachable(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'PROXY_UNREACHABLE'
}

async function callProxy<T>(call: Promise<T>): Promise<T> {
  try {
    return await call
  } catch (error) {
    if (isProxyUnreachable(error)) {
      throw new ApiError(proxyUnreachableResp.description, proxyUnreachableResp.status)
    }
    throw error
  }
}

@Route('proxies')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('proxies')
@provide(ProxyController)
export class ProxyController extends XoController<XoProxy> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('proxy', restApi)
  }

  getAllCollectionObjects(): Promise<XoProxy[]> {
    return this.restApi.xoApp.getAllProxies()
  }
  getCollectionObject(id: XoProxy['id']): Promise<XoProxy> {
    return this.restApi.xoApp.getProxy(id)
  }

  /**
   * Returns all proxies that match the following privilege:
   * - resource: proxy, action: read
   *
   * @example fields "vmUuid,id,name"
   * @example filter "vmUuid?"
   * @example limit 42
   */
  @Example(proxyIds)
  @Example(partialProxies)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  async getProxies(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoProxy>>> {
    const proxies = Object.values(await this.getObjects({ filter }))
    return this.sendObjects(proxies, req, {
      limit,
      privilege: { action: 'read', resource: 'proxy' },
    })
  }

  /**
   * Required privilege:
   * - resource: proxy, action: read
   *
   * @example id "e625ea0c-a876-405a-b838-109d762efe88"
   */
  @Example(proxy)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'proxy',
      action: 'read',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getProxy,
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getProxy(@Path() id: string): Promise<Unbrand<XoProxy>> {
    return this.getObject(id as XoProxy['id'])
  }

  /**
   * Checks that the proxy can be reached
   *
   * Required privilege:
   * - resource: proxy, action: read
   *
   * @example id "e625ea0c-a876-405a-b838-109d762efe88"
   */
  @Example(proxyHealth)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/health')
  @Middlewares(
    acl({
      resource: 'proxy',
      action: 'read',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getProxy,
    })
  )
  @SuccessResponse(200, 'OK')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  @Response(proxyUnreachableResp.status, proxyUnreachableResp.description)
  async getProxyHealth(@Path() id: string): Promise<{ success: true }> {
    await callProxy(this.restApi.xoApp.checkProxyHealth(id as XoProxy['id']))

    return { success: true }
  }

  /**
   * Returns the state of the proxy appliance updater (e.g. `xoa-up-to-date`, or a state ending with `-upgrade-needed`)
   *
   * Before reading the state, sets the updater channel to the one expected by Xen Orchestra.
   * A successful result is cached for 60 seconds per proxy, errors are not cached.
   *
   * Required privilege:
   * - resource: proxy, action: read
   *
   * @example id "e625ea0c-a876-405a-b838-109d762efe88"
   */
  @Example(proxyApplianceUpdaterState)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/appliance_updater_state')
  @Middlewares(
    acl({
      resource: 'proxy',
      action: 'read',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getProxy,
    })
  )
  @SuccessResponse(200, 'OK')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  @Response(proxyUnreachableResp.status, proxyUnreachableResp.description)
  getProxyApplianceUpdaterState(@Path() id: string): ReturnType<XoApp['getProxyApplianceUpdaterState']> {
    return callProxy(this.restApi.xoApp.getProxyApplianceUpdaterState(id as XoProxy['id']))
  }

  /**
   * Upgrades the proxy appliance
   *
   * By default, the upgrade is refused with an `incorrect state` error if backup jobs are running on the proxy.
   *
   * Set `force` to `true` to upgrade by rebooting the proxy VM, which also ignores running jobs. Only available if the
   * proxy VM is known. No privilege on the VM is checked: the `upgrade` action is enough to reboot it.
   *
   * Required privilege:
   * - resource: proxy, action: upgrade
   *
   * @example id "e625ea0c-a876-405a-b838-109d762efe88"
   * @example body { "force": false, "ignoreRunningJobs": false }
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/upgrade')
  @Middlewares([
    json(),
    acl({
      resource: 'proxy',
      action: 'upgrade',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getProxy,
    }),
  ])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(incorrectStateResp.status, incorrectStateResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  @Response(proxyUnreachableResp.status, proxyUnreachableResp.description)
  upgradeProxy(
    @Path() id: string,
    @Body()
    body?: {
      force?: boolean
      ignoreRunningJobs?: boolean
    },
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const proxyId = id as XoProxy['id']
    const force = body?.force ?? false
    const opts = {
      force,
      ignoreRunningJobs: body?.ignoreRunningJobs ?? force,
    }

    const action = async () => {
      await callProxy(this.restApi.xoApp.upgradeProxyAppliance(proxyId, opts))
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'upgrade proxy appliance',
        objectId: proxyId,
        params: body,
      },
    })
  }
}
