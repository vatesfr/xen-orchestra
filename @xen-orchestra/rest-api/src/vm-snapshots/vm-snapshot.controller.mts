import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { Request as ExRequest } from 'express'
import { inject } from 'inversify'

import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { XoVmSnapshot } from '@vates/types'
import { WithHref } from '../helpers/helper.type.mjs'
import { provide } from 'inversify-binding-decorators'
import { partialVmSnapshots, vmSnapshot, vmSnapshotIds } from '../open-api/oa-examples/vm-snapshot.oa-example.mjs'

@Route('vm-snapshots')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vms')
@provide(VmSnapshotController)
export class VmSnapshotController extends XapiXoController<XoVmSnapshot> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('VM-snapshot', restApi)
  }

  /**
   *
   * @example fields "uuid,snapshot_time,$snapshot_of"
   * @example filter "snapshot_time:>1725020038"
   * @example limit 42
   */
  @Example(vmSnapshotIds)
  @Example(partialVmSnapshots)
  @Get('')
  getVmSnapshots(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): string[] | WithHref<Partial<Unbrand<XoVmSnapshot>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "d68fca2c-41e6-be87-d790-105c1642a090"
   */
  @Example(vmSnapshot)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmSnapshot(@Path() id: string): Unbrand<XoVmSnapshot> {
    return this.getObject(id as XoVmSnapshot['id'])
  }
}
