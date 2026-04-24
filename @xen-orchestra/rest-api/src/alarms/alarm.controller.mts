import { Example, Get, Middlewares, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import type { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { XoAlarm, XoMessage } from '@vates/types'

import { alarm, alarmIds, partialAlarms } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { acl, autoBindService } from '../middlewares/acl.middleware.mjs'
import {
  badRequestResp,
  forbiddenOperationResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { AlarmService } from './alarm.service.mjs'

type UnbrandedXoAlarm = Unbrand<XoAlarm>

@Route('alarms')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('alarms')
@provide(AlarmController)
export class AlarmController extends XapiXoController<XoAlarm> {
  #alarmService: AlarmService

  constructor(@inject(RestApi) restApi: RestApi, @inject(AlarmService) alarmService) {
    super('message', restApi)
    this.#alarmService = alarmService
  }

  /**
   * Override parent getObjects in order to only get `ALARM` messages
   */
  getObjects(opts?: { filter?: string; limit?: number }): Record<XoAlarm['id'], XoAlarm> {
    return this.#alarmService.getAlarms(opts)
  }

  /**
   * Override parent getObject in order to only get `ALARM` message
   */
  getObject(id: XoMessage['id']): XoAlarm {
    return this.#alarmService.getAlarm(id)
  }

  /**
   * Returns all alarms that match the following privilege:
   * - resource: alarm, action: read
   *
   * @example fields "body,id,object"
   * @example filter "body:name:physical_utilisation"
   * @example limit 42
   */
  @Example(alarmIds)
  @Example(partialAlarms)
  @Get('')
  @Security('*', ['acl'])
  getAlarms(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<UnbrandedXoAlarm>> {
    return this.sendObjects(Object.values(this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'alarm' },
    })
  }

  /**
   * Required privilege:
   * - resource: alarm, action: read
   *
   * @example id "0c98c71c-2f9c-d5c2-b9b6-2c8371730eab"
   */
  @Example(alarm)
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'alarm',
      action: 'read',
      objectId: 'params.id',
      getObject: autoBindService(AlarmService, 'getAlarm'),
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getAlarm(@Path() id: string): UnbrandedXoAlarm {
    return this.getObject(id as XoAlarm['id'])
  }
}
