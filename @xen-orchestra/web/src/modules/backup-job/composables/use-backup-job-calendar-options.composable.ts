import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobCalendarOption = { label: string; value: number }

export function useBackupJobCalendarOptions() {
  const { locale } = useI18n()

  const monthDayOptions = computed<BackupJobCalendarOption[]>(() =>
    Array.from({ length: 31 }, (_, day) => ({ label: String(day + 1), value: day + 1 }))
  )

  const weekDayOptions = computed<BackupJobCalendarOption[]>(() => {
    const format = new Intl.DateTimeFormat(locale.value, { weekday: 'short', timeZone: 'UTC' })

    return [1, 2, 3, 4, 5, 6, 0].map(day => ({ label: format.format(Date.UTC(2024, 0, 7 + day)), value: day }))
  })

  const hourOptions = computed<BackupJobCalendarOption[]>(() =>
    Array.from({ length: 24 }, (_, hour) => ({ label: String(hour).padStart(2, '0'), value: hour }))
  )

  return {
    monthDayOptions,
    weekDayOptions,
    hourOptions,
  }
}
