import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { Request as ExRequest } from 'express'
import { inject } from 'inversify'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher, limitAndFilterArray } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { XoAlarm, XoVdiSnapshot, XoVmSnapshot } from '@vates/types'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { provide } from 'inversify-binding-decorators'
import {
  partialVmSnapshots,
  vmSnapshot,
  vmSnapshotIds,
  vmSnapshotVdis,
} from '../open-api/oa-examples/vm-snapshot.oa-example.mjs'
import { VmService } from '../vms/vm.service.mjs'

@Route('vm-snapshots')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vms')
@provide(VmSnapshotController)
export class VmSnapshotController extends XapiXoController<XoVmSnapshot> {
  #alarmService: AlarmService
  #vmService: VmService

  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(AlarmService) alarmService: AlarmService,
    @inject(VmService) vmService: VmService
  ) {
    super('VM-snapshot', restApi)
    this.#alarmService = alarmService
    this.#vmService = vmService
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
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVmSnapshot>>> {
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

  /**
   * @example id "d68fca2c-41e6-be87-d790-105c1642a090"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmSnapshotAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vmSnapshot = this.getObject(id as XoVmSnapshot['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${vmSnapshot.uuid}`,
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }

  /**
   * @example id "d68fca2c-41e6-be87-d790-105c1642a090"
   * @example fields "VDI_type,id,name_label"
   * @example filter "VDI_type:user"
   * @example limit 42
   */
  @Example(vmSnapshotVdis)
  @Get('{id}/vdis')
  @Tags('vdis')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmSnapshotVdis(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVdiSnapshot>>> {
    const vdis = this.#vmService.getVmVdis(id as XoVmSnapshot['id'], 'VM-snapshot')
    return this.sendObjects(limitAndFilterArray(vdis, { filter, limit }), req, obj => obj.type.toLowerCase() + 's')
  }
}
