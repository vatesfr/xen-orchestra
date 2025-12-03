import { formatTimeAgoIntl } from '@vueuse/core'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function getRelativeTime(date: MaybeRefOrGetter<Date>, locale: MaybeRefOrGetter<string>) {
  return formatTimeAgoIntl(toValue(date), { locale: toValue(locale) })
}

export default function useRelativeTime(date: MaybeRefOrGetter<Date>) {
  const { locale } = useI18n()

  return computed(() => getRelativeTime(date, locale))
}
