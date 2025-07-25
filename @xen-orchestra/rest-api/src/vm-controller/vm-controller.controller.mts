import { inject } from 'inversify'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { XoAlarm, XoVmController } from '@vates/types'
import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { Request as ExRequest } from 'express'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { provide } from 'inversify-binding-decorators'
import type { SendObjects } from '../helpers/helper.type.mjs'
import {
  partialVmControllers,
  vmController,
  vmControllerIds,
} from '../open-api/oa-examples/vm-controller.oa-example.mjs'

@Route('vm-controllers')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vms')
@provide(VmControllerController)
export class VmControllerController extends XapiXoController<XoVmController> {
  #alarmService: AlarmService
  constructor(@inject(RestApi) restApi: RestApi, @inject(AlarmService) alarmService: AlarmService) {
    super('VM-controller', restApi)
    this.#alarmService = alarmService
  }

  /**
   *
   * @example fields "type,uuid"
   * @example filter "power_state:Running"
   * @example limit 42
   */
  @Example(vmControllerIds)
  @Example(partialVmControllers)
  @Get('')
  getVmControllers(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVmController>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "9b4775bd-9493-490a-9afa-f786a44caa4f"
   */
  @Example(vmController)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmController(@Path() id: string): Unbrand<XoVmController> {
    return this.getObject(id as XoVmController['id'])
  }

  /**
   * @example id "9b4775bd-9493-490a-9afa-f786a44caa4f"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmControllerAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vmController = this.getObject(id as XoVmController['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${vmController.uuid}`,
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }
}
