import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { Request as ExRequest } from 'express'
import type { XoAlarm, XoVdiSnapshot } from '@vates/types'

import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { partialVdiSnapshots, vdiSnapshot, vdiSnapshotIds } from '../open-api/oa-examples/vdi-snapshot.oa-example.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'

@Route('vdi-snapshots')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vdis')
@provide(VdiSnapshotController)
export class VdiSnapshotController extends XapiXoController<XoVdiSnapshot> {
  #alarmService: AlarmService
  constructor(@inject(RestApi) restApi: RestApi, @inject(AlarmService) alarmService: AlarmService) {
    super('VDI-snapshot', restApi)
    this.#alarmService = alarmService
  }

  /**
   * @example fields "uuid,snapshot_time,$snapshot_of"
   * @example filter "snapshot_time:>1725020038"
   * @example limit 42
   */
  @Example(vdiSnapshotIds)
  @Example(partialVdiSnapshots)
  @Get('')
  getVdiSnapshots(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVdiSnapshot>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "d2727772-735b-478f-b6f9-11e7db56dfd0"
   */
  @Example(vdiSnapshot)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVdiSnapshot(@Path() id: string): Unbrand<XoVdiSnapshot> {
    return this.getObject(id as XoVdiSnapshot['id'])
  }

  /**
   * @example id "d2727772-735b-478f-b6f9-11e7db56dfd0"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVdiSnapshotAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vdiSnapshot = this.getObject(id as XoVdiSnapshot['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${filter ?? ''} object:uuid:${vdiSnapshot.uuid}`,
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }
}
