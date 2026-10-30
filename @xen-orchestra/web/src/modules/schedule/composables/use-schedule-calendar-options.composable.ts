import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type ScheduleCalendarOption = { label: string; value: number }

export type ScheduleCalendarOptionsConfig = {
  weekDayFormat?: 'short' | 'long'
  withMinutes?: boolean
}

function padNumber(value: number): string {
  return String(value).padStart(2, '0')
}

export function useScheduleCalendarOptions({
  weekDayFormat = 'short',
  withMinutes = false,
}: ScheduleCalendarOptionsConfig = {}) {
  const { locale } = useI18n()

  const minuteOptions = computed<ScheduleCalendarOption[]>(() =>
    Array.from({ length: 60 }, (_, minute) => ({ label: padNumber(minute), value: minute }))
  )

  const hourOptions = computed<ScheduleCalendarOption[]>(() =>
    Array.from({ length: 24 }, (_, hour) => ({
      label: withMinutes ? `${padNumber(hour)}:00` : padNumber(hour),
      value: hour,
    }))
  )

  const monthDayOptions = computed<ScheduleCalendarOption[]>(() =>
    Array.from({ length: 31 }, (_, day) => ({ label: String(day + 1), value: day + 1 }))
  )

  const monthOptions = computed<ScheduleCalendarOption[]>(() => {
    const format = new Intl.DateTimeFormat(locale.value, { month: 'long', timeZone: 'UTC' })

    return Array.from({ length: 12 }, (_, month) => ({ label: format.format(Date.UTC(2024, month, 1)), value: month }))
  })

  const weekDayOptions = computed<ScheduleCalendarOption[]>(() => {
    const format = new Intl.DateTimeFormat(locale.value, { weekday: weekDayFormat, timeZone: 'UTC' })

    return [1, 2, 3, 4, 5, 6, 0].map(day => ({ label: format.format(Date.UTC(2024, 0, 7 + day)), value: day }))
  })

  return {
    minuteOptions,
    hourOptions,
    monthDayOptions,
    monthOptions,
    weekDayOptions,
  }
}
