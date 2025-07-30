import { XapiXoRecord, XoAlarm, XoMessage } from '@vates/types'
import { RestApi } from '../rest-api/rest-api.mjs'
import * as CM from 'complex-matcher'
import { BASE_URL } from '../index.mjs'

// E.g: 'value: 0.6\nconfig:\n<variable>\n<name value="cpu_usage"/>\n<alarm_trigger_level value="0.4"/>\n<alarm_trigger_period value ="60"/>\n</variable>';
const ALARM_BODY_REGEX = /^value:\s*(Infinity|NaN|-Infinity|\d+(?:\.\d+)?)\s*config:\s*<variable>\s*<name value="(.*?)"/
const ALARM_NAMES = ['ALARM', 'BOND_STATUS_CHANGED', 'MULTIPATH_PERIODIC_ALERT']
export const alarmPredicate = CM.parse(`name:|(${ALARM_NAMES.join(' ')})`).createPredicate()

export class AlarmService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  isAlarm(maybeAlarm: XoMessage) {
    return alarmPredicate(maybeAlarm)
  }

  parseAlarm({ $object, body, time, ...alarm }: XoMessage): XoAlarm {
    let object: XapiXoRecord | { type: 'unknown'; uuid: XapiXoRecord['uuid'] }
    try {
      object = this.#restApi.getObject<XapiXoRecord>($object)
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
        value: Number.isFinite(+value) ? (+value * 100).toFixed(1) : value, // Keep the value as a string because NaN, Infinity, -Infinity is not valid JSON
        name: name ?? body, // for 'BOND_STATUS_CHANGED' and 'MULTIPATH_PERIODIC_ALERT', body is a non-xml string. ("body": "The status of the eth0+eth1 bond is: 1/2 up")
      },
      object: {
        type: object.type,
        uuid: object.uuid,
        href,
      },
      time: time * 1000,
    }
  }

  getAlarms({ filter, limit = Infinity }: { filter?: string | ((obj: XoAlarm) => boolean); limit?: number } = {}) {
    const rawAlarms = this.#restApi.getObjectsByType<XoMessage>('message', {
      filter: alarmPredicate,
    })

    let userFilter: (obj: XoAlarm) => boolean = () => true
    if (filter !== undefined) {
      userFilter = typeof filter === 'string' ? CM.parse(filter).createPredicate() : filter
    }
    const alarms: Record<XoAlarm['id'], XoAlarm> = {}
    for (const id in rawAlarms) {
      if (limit === 0) {
        break
      }
      const alarm = this.parseAlarm(rawAlarms[id])
      if (userFilter(alarm)) {
        alarms[id] = alarm
        limit--
      }
    }
    return alarms
  }
}
