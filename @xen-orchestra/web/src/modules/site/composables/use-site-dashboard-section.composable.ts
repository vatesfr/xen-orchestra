import { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

export function useSiteDashboardSection<TSection extends object, TKey extends PropertyKey>(
  section: MaybeRefOrGetter<TSection | undefined>,
  liveKey: TKey
) {
  const { hasError: hasDashboardError } = useXoSiteDashboard()

  const isLoading = computed(() => toValue(section) === undefined)

  const isEmpty = computed(() => {
    const value = toValue(section)

    return value !== undefined && 'isEmpty' in value
  })

  const hasError = computed(() => {
    const value = toValue(section)

    return hasDashboardError.value || (value !== undefined && 'error' in value)
  })

  const data = computed(() => {
    const value = toValue(section)

    if (value === undefined || !(liveKey in value)) {
      return undefined
    }

    return value as Extract<TSection, Record<TKey, unknown>>
  })

  return { data, isLoading, isEmpty, hasError }
}
