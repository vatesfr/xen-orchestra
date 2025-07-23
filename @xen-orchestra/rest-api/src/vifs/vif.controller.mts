import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import type { Request as ExRequest } from 'express'
import type { XoAlarm, XoVif } from '@vates/types'

import { provide } from 'inversify-binding-decorators'
import { RestApi } from '../rest-api/rest-api.mjs'
import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { partialVifs, vif, vifIds } from '../open-api/oa-examples/vif.oa-example.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'

type UnbrandedXoVif = Unbrand<XoVif>

@Route('vifs')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vifs')
@provide(VifController)
export class VifController extends XapiXoController<XoVif> {
  #alarmService: AlarmService
  constructor(@inject(RestApi) restApi: RestApi, @inject(AlarmService) alarmService: AlarmService) {
    super('VIF', restApi)
    this.#alarmService = alarmService
  }

  /**
   * @example fields "attached,id,device"
   * @example filter "attached?"
   * @example limit 42
   */
  @Example(vifIds)
  @Example(partialVifs)
  @Get('')
  getVifs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<UnbrandedXoVif>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   */
  @Example(vif)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVif(@Path() id: string): UnbrandedXoVif {
    return this.getObject(id as XoVif['id'])
  }

  /**
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVifAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vif = this.getObject(id as XoVif['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${filter ?? ''} object:uuid:${vif.uuid}`,
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }
}
