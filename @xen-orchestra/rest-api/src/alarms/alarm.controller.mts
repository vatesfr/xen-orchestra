import * as CM from 'complex-matcher'
import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import type { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { noSuchObject } from 'xo-common/api-errors.js'
import { provide } from 'inversify-binding-decorators'
import type { XapiXoRecord, XoAlarm, XoMessage } from '@vates/types'

import { alarm, alarmIds, partialAlarms } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { BASE_URL } from '../index.mjs'
import { notFoundResp, unauthorizedResp, Unbrand } from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

// E.g: 'value: 0.6\nconfig:\n<variable>\n<name value="cpu_usage"/>\n<alarm_trigger_level value="0.4"/>\n<alarm_trigger_period value ="60"/>\n</variable>';
const ALARM_BODY_REGEX = /^value:\s*(Infinity|NaN|-Infinity|\d+(?:\.\d+)?)\s*config:\s*<variable>\s*<name value="(.*?)"/
const ALARM_NAMES = ['ALARM', 'BOND_STATUS_CHANGED', 'MULTIPATH_PERIODIC_ALERT']
export const alarmPredicate = CM.parse(`name:|(${ALARM_NAMES.join(' ')})`).createPredicate()

type UnbrandedXoAlarm = Unbrand<XoAlarm>

@Route('alarms')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('alarms')
@provide(AlarmController)
export class AlarmController extends XapiXoController<XoAlarm> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('message', restApi)
  }

  #parseAlarm({ $object, body, ...alarm }: XoMessage): XoAlarm {
    let object: XapiXoRecord | { type: 'unknown'; uuid: XapiXoRecord['uuid'] }
    try {
      object = this.restApi.getObject<XapiXoRecord>($object)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      object = {
        type: 'unknown',
        uuid: $object,
      }
    }

    let href: string | undefined
    if (object.type !== 'unknown') {
      href = `${BASE_URL}/${object.type.toLowerCase() + 's'}/${object.uuid}`
    }

    const [, value, name] = body.match(ALARM_BODY_REGEX) ?? []
    return {
      ...alarm,
      body: {
        value, // Keep the value as a string because NaN, Infinity, -Infinity is not valid JSON
        name: name ?? body, // for 'BOND_STATUS_CHANGED' and 'MULTIPATH_PERIODIC_ALERT', body is a non-xml string. ("body": "The status of the eth0+eth1 bond is: 1/2 up")
      },
      object: {
        type: object.type,
        uuid: object.uuid,
        href,
      },
    }
  }

  /**
   * Override parent getObjects in order to only get `ALARM` messages
   */
  getObjects({ filter, limit = Infinity }: { filter?: string; limit?: number } = {}): Record<XoAlarm['id'], XoAlarm> {
    const rawAlarms = this.restApi.getObjectsByType<XoMessage>('message', {
      filter: alarmPredicate,
    })

    let userFilter: (obj: XoAlarm) => boolean = () => true
    if (filter !== undefined) {
      userFilter = CM.parse(filter).createPredicate()
    }
    const alarms: Record<XoAlarm['id'], XoAlarm> = {}
    for (const id in rawAlarms) {
      if (limit === 0) {
        break
      }
      const alarm = this.#parseAlarm(rawAlarms[id])
      if (userFilter(alarm)) {
        alarms[id] = alarm
        limit--
      }
    }
    return alarms
  }

  /**
   * Override parent getObject in order to only get `ALARM` message
   */
  getObject(id: XoAlarm['id']): XoAlarm {
    const maybeAlarm = this.restApi.getObject<XoMessage>(id, 'message')

    if (!alarmPredicate(maybeAlarm)) {
      /* throw */ noSuchObject(id, 'alarm')
    }

    return this.#parseAlarm(maybeAlarm)
  }

  /**
   * @example fields "body,id,object"
   * @example filter "body:name:physical_utilisation"
   * @example limit 42
   */
  @Example(alarmIds)
  @Example(partialAlarms)
  @Get('')
  getAlarms(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<UnbrandedXoAlarm>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "0c98c71c-2f9c-d5c2-b9b6-2c8371730eab"
   */
  @Example(alarm)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getAlarm(@Path() id: string): UnbrandedXoAlarm {
    return this.getObject(id as XoAlarm['id'])
  }
}
