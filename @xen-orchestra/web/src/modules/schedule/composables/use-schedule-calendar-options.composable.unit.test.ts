import {
  type ScheduleCalendarOptionsConfig,
  useScheduleCalendarOptions,
} from '@/modules/schedule/composables/use-schedule-calendar-options.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { useI18n } from 'vue-i18n'

function mountCalendarOptions(config?: ScheduleCalendarOptionsConfig) {
  return mountComposable(() => {
    const { locale } = useI18n()

    return { ...useScheduleCalendarOptions(config), locale }
  }).wrapper.vm
}

describe('minuteOptions', () => {
  it('offers every minute, padded to two digits', () => {
    const { minuteOptions } = mountCalendarOptions()

    expect(minuteOptions).toHaveLength(60)
    expect(minuteOptions.slice(0, 2)).toEqual([
      { label: '00', value: 0 },
      { label: '01', value: 1 },
    ])
  })
})

describe('hourOptions', () => {
  it('offers every hour, padded to two digits', () => {
    const { hourOptions } = mountCalendarOptions()

    expect(hourOptions).toHaveLength(24)
    expect(hourOptions.at(-1)).toEqual({ label: '23', value: 23 })
  })

  it('shows the minutes of the hours when asked to', () => {
    expect(mountCalendarOptions({ withMinutes: true }).hourOptions[2]).toEqual({ label: '02:00', value: 2 })
  })
})

describe('monthDayOptions', () => {
  it('offers every day of the month, from 1 to 31', () => {
    const { monthDayOptions } = mountCalendarOptions()

    expect(monthDayOptions.map(option => option.value)).toEqual(Array.from({ length: 31 }, (_, day) => day + 1))
    expect(monthDayOptions[0].label).toBe('1')
  })
})

describe('monthOptions', () => {
  it('names every month in the locale, numbered from 0', () => {
    const result = mountCalendarOptions()
    const format = new Intl.DateTimeFormat(result.locale, { month: 'long', timeZone: 'UTC' })

    expect(result.monthOptions).toHaveLength(12)
    expect(result.monthOptions[0]).toEqual({ label: format.format(Date.UTC(2024, 0, 1)), value: 0 })
  })
})

describe('weekDayOptions', () => {
  it('starts the week on Monday and ends it on Sunday', () => {
    expect(mountCalendarOptions().weekDayOptions.map(option => option.value)).toEqual([1, 2, 3, 4, 5, 6, 0])
  })

  it.each(['short', 'long'] as const)('names the days of the week in the %s format of the locale', weekDayFormat => {
    const result = mountCalendarOptions({ weekDayFormat })
    const format = new Intl.DateTimeFormat(result.locale, { weekday: weekDayFormat, timeZone: 'UTC' })

    expect(result.weekDayOptions[0].label).toBe(format.format(Date.UTC(2024, 0, 8)))
  })
})
