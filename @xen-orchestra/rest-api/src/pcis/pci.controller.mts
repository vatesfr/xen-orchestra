import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import type { XoPci } from '@vates/types'

import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { partialPcis, pci, pciIds } from '../open-api/oa-examples/pci.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

@Route('pcis')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('pcis')
@provide(PciController)
export class PciController extends XapiXoController<XoPci> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('PCI', restApi)
  }

  /**
   * @example fields "class_name,device_name,id"
   * @example filter "class_name:Non-Volatile memory controller"
   * @example limit 42
   */
  @Example(pciIds)
  @Example(partialPcis)
  @Get('')
  getPcis(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoPci>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "9377b642-cc71-8749-1e71-308898b652da"
   */
  @Example(pci)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getPci(@Path() id: string): Unbrand<XoPci> {
    return this.getObject(id as XoPci['id'])
  }
}
