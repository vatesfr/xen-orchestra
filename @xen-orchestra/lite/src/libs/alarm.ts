import type { RawObjectType, XenApiMessage } from '@/libs/xen-api/xen-api.types'
import type { XenApiAlarm, XenApiAlarmType } from '@/types/xen-api'

const parseXml = (xml: string) => {
  const parser = new DOMParser()
  const dom = parser.parseFromString(xml, 'text/xml')

  if (dom.querySelector('parsererror') !== null) {
    return {}
  }

  const variable = dom.querySelector('variable')

  const type = variable?.querySelector('name')?.getAttribute('value') as XenApiAlarmType

  const triggerLevel = variable?.querySelector('alarm_trigger_level')?.getAttribute('value')

  return {
    type,
    triggerLevel,
  }
}

// body is a string in the following form:
// ```
// value: 0.960224
// config:
// <variable>
//     <name value="mem_usage"/>
//     <alarm_trigger_level value="0.95"/>
//     <... />
// </variable>
// ```
export const parseAlarmBody = (body: string): { level: number; type: XenApiAlarmType; triggerLevel: number } => {
  const lines = body.split('\n')
  const level = parseFloat(lines[0].split(':')[1].trim())

  const document = parseXml(lines.slice(2).join('\n'))

  return {
    level: isNaN(level) ? 0 : level,
    type: document.type ?? 'unknown',
    triggerLevel: parseFloat(document.triggerLevel ?? '0'),
  }
}

export const messageToAlarm = <RelationType extends RawObjectType>(
  message: XenApiMessage<RelationType> | undefined
): XenApiAlarm<RelationType> | undefined => {
  if (message === undefined || !['ALARM', 'BOND_STATUS_CHANGED', 'MULTIPATH_PERIODIC_ALERT'].includes(message.name)) {
    return
  }

  return {
    ...message,
    ...parseAlarmBody(message.body),
  }
}

export const messagesToAlarms = (messages: XenApiMessage<any>[]) => {
  return messages.reduce((acc, message) => {
    const alarm = messageToAlarm(message)

    if (alarm !== undefined) {
      acc.push(alarm)
    }

    return acc
  }, [] as XenApiAlarm<any>[])
}
