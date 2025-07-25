import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { Request as ExRequest } from 'express'
import type { XoAlarm, XoSr } from '@vates/types'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { partialSrs, sr, srIds } from '../open-api/oa-examples/sr.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

@Route('srs')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('srs')
@provide(SrController)
export class SrController extends XapiXoController<XoSr> {
  #alarmService: AlarmService
  constructor(@inject(RestApi) restApi: RestApi, @inject(AlarmService) alarmService: AlarmService) {
    super('SR', restApi)
    this.#alarmService = alarmService
  }

  /**
   * @example fields "uuid,name_label,allocationStrategy"
   * @example filter "allocationStrategy:thin"
   * @example limit 42
   */
  @Example(srIds)
  @Example(partialSrs)
  @Get('')
  getSrs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoSr>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Example(sr)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getSr(@Path() id: string): Unbrand<XoSr> {
    return this.getObject(id as XoSr['id'])
  }

  /**
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getSrAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const sr = this.getObject(id as XoSr['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${sr.uuid}`,
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }
}
