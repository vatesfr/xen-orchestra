import {
  CRON_FIELD_RANGES,
  formatCronField,
  getCronFieldStep,
  getMaxStep,
  getNextRunDates,
  getRangeValues,
  getSelectedValues,
  getStepValues,
  joinCron,
  parseCronField,
  splitCron,
  toCronFieldStepValue,
  toggleCronFieldValue,
} from '@/modules/schedule/utils/cron.util.ts'

describe('getRangeValues', () => {
  it('lists every value of the range, bounds included', () => {
    expect(getRangeValues({ min: 1, max: 4 })).toEqual([1, 2, 3, 4])
  })
})

describe('getMaxStep', () => {
  it('allows a step up to half of the range', () => {
    expect(getMaxStep(CRON_FIELD_RANGES.hour)).toBe(12)
    expect(getMaxStep(CRON_FIELD_RANGES.monthDay)).toBe(15)
  })
})

describe('getStepValues', () => {
  it('keeps one value every step, starting with the first one', () => {
    expect(getStepValues([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([1, 4, 7])
  })

  it('keeps every value with a step of 1', () => {
    expect(getStepValues([0, 6, 12], 1)).toEqual([0, 6, 12])
  })
})

describe('splitCron', () => {
  it('splits a cron expression into its fields', () => {
    expect(splitCron('5 4 * 1 0')).toEqual({ minute: '5', hour: '4', monthDay: '*', month: '1', weekDay: '0' })
  })

  it('ignores extra spaces', () => {
    expect(splitCron('  5   4 * 1 0 ')).toEqual({ minute: '5', hour: '4', monthDay: '*', month: '1', weekDay: '0' })
  })

  it('fills missing fields with any value', () => {
    expect(splitCron('5 4')).toEqual({ minute: '5', hour: '4', monthDay: '*', month: '*', weekDay: '*' })
  })
})

describe('joinCron', () => {
  it('builds a cron expression from its fields', () => {
    expect(joinCron({ minute: '5', hour: '4', monthDay: '*', month: '1', weekDay: '0' })).toBe('5 4 * 1 0')
  })
})

describe('parseCronField', () => {
  it('reads any value', () => {
    expect(parseCronField('*', CRON_FIELD_RANGES.hour)).toEqual({ type: 'all' })
  })

  it('reads a step', () => {
    expect(parseCronField('*/6', CRON_FIELD_RANGES.hour)).toEqual({ type: 'step', step: 6 })
  })

  it('reads a step of 1 as any value', () => {
    expect(parseCronField('*/1', CRON_FIELD_RANGES.hour)).toEqual({ type: 'all' })
  })

  it('reads a list of values and ranges, sorted and without duplicates', () => {
    expect(parseCronField('8,1-3,2', CRON_FIELD_RANGES.hour)).toEqual({ type: 'list', values: [1, 2, 3, 8] })
  })

  it('ignores the values out of the range', () => {
    expect(parseCronField('2,24', CRON_FIELD_RANGES.hour)).toEqual({ type: 'list', values: [2] })
  })

  it('ignores a reversed range', () => {
    expect(parseCronField('5-2,8', CRON_FIELD_RANGES.hour)).toEqual({ type: 'list', values: [8] })
  })

  it('reads a field without valid value as any value', () => {
    expect(parseCronField('a,99', CRON_FIELD_RANGES.hour)).toEqual({ type: 'all' })
  })

  it('reads a list covering the whole range as any value', () => {
    expect(parseCronField('0-6', CRON_FIELD_RANGES.weekDay)).toEqual({ type: 'all' })
  })
})

describe('formatCronField', () => {
  it('formats any value', () => {
    expect(formatCronField({ type: 'all' })).toBe('*')
  })

  it('formats a step', () => {
    expect(formatCronField({ type: 'step', step: 6 })).toBe('*/6')
  })

  it('formats a list of values', () => {
    expect(formatCronField({ type: 'list', values: [1, 2, 8] })).toBe('1,2,8')
  })
})

describe('getSelectedValues', () => {
  it('selects every value of the range for any value', () => {
    expect(getSelectedValues({ type: 'all' }, CRON_FIELD_RANGES.weekDay)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('selects every step from the start of the range', () => {
    expect(getSelectedValues({ type: 'step', step: 10 }, CRON_FIELD_RANGES.monthDay)).toEqual([1, 11, 21, 31])
  })

  it('selects the values of a list', () => {
    expect(getSelectedValues({ type: 'list', values: [2, 4] }, CRON_FIELD_RANGES.weekDay)).toEqual([2, 4])
  })
})

describe('toggleCronFieldValue', () => {
  it('adds a value to the selection', () => {
    expect(toggleCronFieldValue({ type: 'list', values: [4] }, CRON_FIELD_RANGES.weekDay, 2)).toEqual({
      type: 'list',
      values: [2, 4],
    })
  })

  it('removes a value from the selection', () => {
    expect(toggleCronFieldValue({ type: 'list', values: [2, 4] }, CRON_FIELD_RANGES.weekDay, 4)).toEqual({
      type: 'list',
      values: [2],
    })
  })

  it('removes a value from any value', () => {
    expect(toggleCronFieldValue({ type: 'all' }, CRON_FIELD_RANGES.weekDay, 0)).toEqual({
      type: 'list',
      values: [1, 2, 3, 4, 5, 6],
    })
  })

  it('keeps the first value of the range when the last value is removed', () => {
    expect(toggleCronFieldValue({ type: 'list', values: [3] }, CRON_FIELD_RANGES.monthDay, 3)).toEqual({
      type: 'list',
      values: [1],
    })
  })

  it('selects any value once the whole range is selected', () => {
    expect(toggleCronFieldValue({ type: 'list', values: [0, 1, 2, 3, 4, 5] }, CRON_FIELD_RANGES.weekDay, 6)).toEqual({
      type: 'all',
    })
  })
})

describe('getCronFieldStep', () => {
  it('has a step of 1 for any value', () => {
    expect(getCronFieldStep({ type: 'all' })).toBe(1)
  })

  it('gives the step of a step', () => {
    expect(getCronFieldStep({ type: 'step', step: 6 })).toBe(6)
  })

  it('has no step for a list of values', () => {
    expect(getCronFieldStep({ type: 'list', values: [1, 2] })).toBeUndefined()
  })
})

describe('toCronFieldStepValue', () => {
  it('gives any value for a step of 1', () => {
    expect(toCronFieldStepValue(1)).toEqual({ type: 'all' })
  })

  it('gives a step above 1', () => {
    expect(toCronFieldStepValue(6)).toEqual({ type: 'step', step: 6 })
  })
})

describe('getNextRunDates', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T10:30:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('gives the next runs of the cron in its timezone', () => {
    expect(getNextRunDates('0 1 * * *', 'Europe/Paris', 2)).toEqual([
      new Date('2026-10-20T23:00:00Z'),
      new Date('2026-10-21T23:00:00Z'),
    ])
  })

  it('has no next run for an invalid cron', () => {
    expect(getNextRunDates('not a cron', 'Europe/Paris', 2)).toEqual([])
  })
})
