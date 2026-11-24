import {
  Body,
  Example,
  Extension,
  Get,
  Middlewares,
  Patch,
  Path,
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
import type { XoProxy, XoVm } from '@vates/types'
import { forbiddenOperation } from 'xo-common/api-errors.js'

import { acl, actionFromBody } from '../middlewares/acl.middleware.mjs'
import { ApiError } from '../helpers/error.helper.mjs'
import {
  badRequestResp,
  forbiddenOperationResp,
  internalServerErrorResp,
  invalidParameters,
  noContentResp,
  notFoundResp,
  proxyUnreachableResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { partialProxies, proxy, proxyHealth, proxyIds } from '../open-api/oa-examples/proxy.oa-example.mjs'
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
   * Updates a proxy
   *
   * Set `address` or `vmUuid` to `null` to remove it.
   *
   * Only an administrator can change `address` or `vmUuid`
   *
   * Required privileges:
   * - resource: proxy, action: update (grants all fields)
   * - resource: proxy, action: update:name (if name is passed)
   *
   * @example id "e625ea0c-a876-405a-b838-109d762efe88"
   * @example body { "name": "My proxy" }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('{id}')
  @Middlewares([
    json(),
    acl({
      resource: 'proxy',
      action: actionFromBody<'proxy'>('update:name'),
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getProxy,
    }),
  ])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async updateProxy(
    @Path() id: string,
    @Body() body: { address?: string | null; name?: string; vmUuid?: string | null }
  ): Promise<void> {
    const user = this.restApi.getCurrentUser()
    if (user.permission !== 'admin' && (body.address !== undefined || body.vmUuid !== undefined)) {
      throw forbiddenOperation('update proxy', 'only an administrator can change address or vmUuid')
    }

    if (typeof body.vmUuid === 'string') {
      this.restApi.getObject<XoVm>(body.vmUuid as XoVm['id'], 'VM')
    }

    await this.restApi.xoApp.updateProxy(id as XoProxy['id'], {
      ...body,
      vmUuid: body.vmUuid as XoVm['id'] | null | undefined,
    })
  }
}
