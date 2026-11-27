import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store.ts'
import { useTimeAgo } from '@core/composables/locale-time-ago.composable.ts'
import { formatDate, parseDateTime } from '@core/utils/time.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

const XAPI_UNSET_DATE_TIME = '19700101T00:00:00Z'

function getValidDateTime(dateTime: string | undefined): string | undefined {
  return dateTime === XAPI_UNSET_DATE_TIME ? undefined : dateTime
}

export function useVmMetricsInfo(rawVm: MaybeRefOrGetter<XenApiVm>) {
  const { t } = useI18n()

  const vm = toComputed(rawVm)

  const { getByOpaqueRef: getGuestMetrics } = useVmGuestMetricsStore().subscribe()
  const { getByOpaqueRef: getVmMetrics } = useVmMetricsStore().subscribe()

  const guestMetrics = computed(() => getGuestMetrics(vm.value.guest_metrics))

  const vmMetrics = computed(() => getVmMetrics(vm.value.metrics))

  const osName = computed(() => guestMetrics.value?.os_version.name)

  const guestTools = computed(() => {
    const version = guestMetrics.value?.PV_drivers_version

    if (!guestMetrics.value?.PV_drivers_detected || !version || Object.entries(version).length === 0) {
      return undefined
    }

    return `${version.major}.${version.minor}.${version.micro}-${version.build}`
  })

  const startTime = computed(() => {
    const dateTime = getValidDateTime(vmMetrics.value?.start_time)

    return dateTime ? new Date(parseDateTime(dateTime)) : undefined
  })

  const vmTimeAgo = useTimeAgo(() => startTime.value ?? 0)

  const relativeStartTime = computed(() => (startTime.value === undefined ? t('not-running') : vmTimeAgo.value))

  const installTime = computed(() => getValidDateTime(vmMetrics.value?.install_time))

  const installDateFormatted = computed(() =>
    installTime.value === undefined ? t('unknown') : formatDate(installTime.value)
  )

  return {
    osName,
    guestTools,
    startTime,
    relativeStartTime,
    installTime,
    installDateFormatted,
  }
}
