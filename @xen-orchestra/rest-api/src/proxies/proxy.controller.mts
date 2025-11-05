import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import type { XoProxy } from '@vates/types'

import { badRequestResp, notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { partialProxies, proxy, proxyIds } from '../open-api/oa-examples/proxy.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'

@Route('proxies')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('proxies')
@provide(ProxyController)
export class ProxyController extends XoController<XoProxy> {
  getAllCollectionObjects(): Promise<XoProxy[]> {
    return this.restApi.xoApp.getAllProxies()
  }
  getCollectionObject(id: XoProxy['id']): Promise<XoProxy> {
    return this.restApi.xoApp.getProxy(id)
  }

  /**
   * @example fields "vmUuid,id,name"
   * @example filter "vmUuid?"
   * @example limit 42
   */
  @Example(proxyIds)
  @Example(partialProxies)
  @Get('')
  async getProxies(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoProxy>>>> {
    const proxies = Object.values(await this.getObjects({ filter, limit }))
    return this.sendObjects(proxies, req)
  }

  /**
   * @example id "e625ea0c-a876-405a-b838-109d762efe88"
   */
  @Example(proxy)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getProxy(@Path() id: string): Promise<Unbrand<XoProxy>> {
    return this.getObject(id as XoProxy['id'])
  }
}
