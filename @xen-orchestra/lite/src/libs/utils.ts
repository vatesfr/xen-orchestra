import type { Filter } from '@/types/filter'
import { faSquareCheck } from '@fortawesome/free-regular-svg-icons'
import { faFont, faHashtag, faList } from '@fortawesome/free-solid-svg-icons'
import { utcParse } from 'd3-time-format'
import format from 'human-format'
import { find, forEach, round, size, sum } from 'lodash-es'

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const iconsByType = {
  string: faFont,
  number: faHashtag,
  boolean: faSquareCheck,
  enum: faList,
}

export function formatSize(bytes: number) {
  return bytes != null ? format(bytes, { scale: 'binary', unit: 'B' }) : 'N/D'
}

export function getFilterIcon(filter: Filter | undefined) {
  if (!filter) {
    return
  }

  if (filter.icon) {
    return filter.icon
  }

  return iconsByType[filter.type]
}

export function parseDateTime(dateTime: Date | string | number): number {
  if (typeof dateTime === 'number') {
    return dateTime
  }

  if (dateTime instanceof Date) {
    return dateTime.getTime()
  }

  dateTime = dateTime.replace(/(-|\.\d{3})/g, '') // Allow toISOString() date-time format
  const date = utcParse('%Y%m%dT%H:%M:%SZ')(dateTime)
  if (date === null) {
    throw new RangeError(`unable to parse XAPI datetime ${JSON.stringify(dateTime)}`)
  }
  return date.getTime()
}

export function percent(currentValue: number, maxValue: number, precision = 2) {
  return round((currentValue / maxValue) * 100, precision)
}

export function getAvgCpuUsage(cpus?: object | any[], { nSequence = 4 } = {}) {
  const statsLength = getStatsLength(cpus)
  if (statsLength === undefined) {
    return
  }
  const _nSequence = statsLength < nSequence ? statsLength : nSequence

  let totalCpusUsage = 0
  forEach(cpus, (cpuState: number[]) => {
    totalCpusUsage += sum(cpuState.slice(cpuState.length - _nSequence))
  })
  const stackedValue = totalCpusUsage / _nSequence
  return stackedValue / size(cpus)
}

// stats can be null.
// Return the size of the first non-null object.
export function getStatsLength(stats?: object | any[]) {
  if (stats === undefined) {
    return undefined
  }
  return size(find(stats, stat => stat != null))
}

export function parseRamUsage(
  {
    memory,
    memoryFree,
  }: {
    memory: number[]
    memoryFree?: number[]
  },
  { nSequence = 4 } = {}
) {
  const _nSequence = Math.min(memory.length, nSequence)

  let total = 0
  let used = 0

  memory = memory.slice(memory.length - _nSequence)
  memoryFree = memoryFree?.slice(memoryFree.length - _nSequence)

  memory.forEach((ram, key) => {
    total += ram
    used += ram - (memoryFree?.[key] ?? 0)
  })

  const percentUsed = percent(used, total)
  return {
    // In case `memoryFree` is not given by the xapi,
    // we won't be able to calculate the percentage of used memory properly.
    percentUsed: memoryFree === undefined || isNaN(percentUsed) ? 0 : percentUsed,
    total: total / _nSequence,
    used: memoryFree === undefined ? 0 : used / _nSequence,
  }
}

export const getFirst = <T>(value: T | T[]): T | undefined => (Array.isArray(value) ? value[0] : value)

export function isIpv6(ip: string) {
  return ip.includes(':')
}

export function ipToHostname(ip: string) {
  return isIpv6(ip) ? `[${ip}]` : ip
}
