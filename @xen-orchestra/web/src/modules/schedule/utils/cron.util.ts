import { createSchedule } from '@xen-orchestra/cron'

export type CronFieldName = 'minute' | 'hour' | 'monthDay' | 'month' | 'weekDay'

export type CronFieldRange = { min: number; max: number }

export type CronFieldValue = { type: 'all' } | { type: 'step'; step: number } | { type: 'list'; values: number[] }

export type CronFields = Record<CronFieldName, string>

export const CRON_FIELD_NAMES: CronFieldName[] = ['minute', 'hour', 'monthDay', 'month', 'weekDay']

export const CRON_FIELD_RANGES: Record<CronFieldName, CronFieldRange> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  monthDay: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  weekDay: { min: 0, max: 6 },
}

export const DEFAULT_CRON = '0 0 * * *'

export function getRangeValues({ min, max }: CronFieldRange): number[] {
  return Array.from({ length: max - min + 1 }, (_, index) => min + index)
}

export function getMaxStep(range: CronFieldRange): number {
  return Math.floor(getRangeValues(range).length / 2)
}

export function splitCron(cron: string): CronFields {
  const parts = cron.trim().split(/\s+/)

  return Object.fromEntries(CRON_FIELD_NAMES.map((name, index) => [name, parts[index] ?? '*'])) as CronFields
}

export function joinCron(fields: CronFields): string {
  return CRON_FIELD_NAMES.map(name => fields[name]).join(' ')
}

function isInRange(value: number, { min, max }: CronFieldRange): boolean {
  return Number.isInteger(value) && value >= min && value <= max
}

function parseListItem(item: string, range: CronFieldRange): number[] {
  const [start, end] = item.split('-').map(Number)

  if (end === undefined) {
    return isInRange(start, range) ? [start] : []
  }

  if (!isInRange(start, range) || !isInRange(end, range) || start > end) {
    return []
  }

  return getRangeValues({ min: start, max: end })
}

export function parseCronField(raw: string, range: CronFieldRange): CronFieldValue {
  if (raw === '*') {
    return { type: 'all' }
  }

  const stepMatch = /^\*\/(\d+)$/.exec(raw)

  if (stepMatch !== null) {
    const step = Number(stepMatch[1])

    return step <= 1 ? { type: 'all' } : { type: 'step', step }
  }

  const values = [...new Set(raw.split(',').flatMap(item => parseListItem(item, range)))].sort((a, b) => a - b)

  if (values.length === 0) {
    return { type: 'all' }
  }

  return values.length === getRangeValues(range).length ? { type: 'all' } : { type: 'list', values }
}

export function formatCronField(value: CronFieldValue): string {
  switch (value.type) {
    case 'all':
      return '*'
    case 'step':
      return `*/${value.step}`
    case 'list':
      return value.values.join(',')
  }
}

export function getSelectedValues(value: CronFieldValue, range: CronFieldRange): number[] {
  const rangeValues = getRangeValues(range)

  switch (value.type) {
    case 'all':
      return rangeValues
    case 'step':
      return rangeValues.filter(rangeValue => (rangeValue - range.min) % value.step === 0)
    case 'list':
      return value.values
  }
}

export function toggleCronFieldValue(value: CronFieldValue, range: CronFieldRange, toggled: number): CronFieldValue {
  const selected = new Set(getSelectedValues(value, range))

  if (selected.has(toggled)) {
    selected.delete(toggled)
  } else {
    selected.add(toggled)
  }

  if (selected.size === 0) {
    return { type: 'list', values: [range.min] }
  }

  if (selected.size === getRangeValues(range).length) {
    return { type: 'all' }
  }

  return { type: 'list', values: [...selected].sort((a, b) => a - b) }
}

export function getCronFieldStep(value: CronFieldValue): number | undefined {
  switch (value.type) {
    case 'all':
      return 1
    case 'step':
      return value.step
    case 'list':
      return undefined
  }
}

export function setCronFieldStep(step: number): CronFieldValue {
  return step <= 1 ? { type: 'all' } : { type: 'step', step }
}

export function getNextRunDates(cron: string, timezone: string | undefined, count: number): Date[] {
  try {
    return createSchedule(cron, timezone).next(count)
  } catch {
    return []
  }
}
