import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { Request as ExRequest } from 'express'
import type { XoAlarm, XoVdi } from '@vates/types'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { partialVdis, vdi, vdiIds } from '../open-api/oa-examples/vdi.oa-example.mjs'

@Route('vdis')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vdis')
@provide(VdiController)
export class VdiController extends XapiXoController<XoVdi> {
  #alarmService: AlarmService
  constructor(@inject(RestApi) restApi: RestApi, @inject(AlarmService) alarmService: AlarmService) {
    super('VDI', restApi)
    this.#alarmService = alarmService
  }

  /**
   * @example fields "*"
   * @example filter "snapshots:length:>2"
   * @example limit 42
   */
  @Example(vdiIds)
  @Example(partialVdis)
  @Get('')
  getVdis(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVdi>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   */
  @Example(vdi)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVdi(@Path() id: string): Unbrand<XoVdi> {
    return this.getObject(id as XoVdi['id'])
  }

  /**
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVdiAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vdi = this.getObject(id as XoVdi['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${filter ?? ''} object:uuid:${vdi.uuid}`,
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }
}
