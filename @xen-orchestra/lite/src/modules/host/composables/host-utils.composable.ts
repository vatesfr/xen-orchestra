import { HOST_OPERATION } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { getHostPendingStateOperation, getHostState, type HostState } from '@/modules/host/utils/host.util.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import type { IconName } from '@core/icons'
import { useTimeAgo } from '@core/composables/locale-time-ago.composable.ts'
import { createMapper, useMapper } from '@core/packages/mapper'
import { parseDateTime } from '@core/utils/time.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useHostUtils(rawHost: MaybeRefOrGetter<XenApiHost | undefined>) {
  const { t } = useI18n()

  const host = toComputed(rawHost)

  const { getHostPowerState } = useHostMetricsStore().subscribe()

  const { isMasterHost } = usePoolStore().subscribe()

  const isMaster = computed(() => {
    if (host.value === undefined) {
      return false
    }

    return isMasterHost(host.value.$ref)
  })

  const hostPowerState = computed(() => getHostPowerState(host.value))

  const isRunning = computed(() => hostPowerState.value === HOST_POWER_STATE.RUNNING)

  const hostState = computed(() => getHostState(host.value, hostPowerState.value))

  const powerState = useMapper<HostState, { text: string; icon: IconName | undefined }>(
    hostState,
    () => ({
      running: { text: t('host:status:running'), icon: 'status:running-circle' },
      halted: { text: t('host:status:halted'), icon: 'status:halted-circle' },
      disabled: { text: t('host:status:disabled'), icon: 'status:host-disabled-circle' },
      unknown: { text: t('host:status:unknown'), icon: undefined },
    }),
    'unknown'
  )

  const bootTime = computed(() => Number(host.value?.other_config.boot_time))

  const hostTimeAgo = useTimeAgo(() => new Date(parseDateTime((bootTime.value || 0) * 1000)))

  const relativeStartTime = computed(() => {
    if (!bootTime.value) {
      return undefined
    }

    return hostTimeAgo.value
  })

  const pendingStateOperation = computed(() => {
    if (host.value === undefined) {
      return undefined
    }

    return getHostPendingStateOperation(host.value, isRunning.value)
  })

  const isChangingState = computed(() => pendingStateOperation.value !== undefined)

  const currentOperation = useMapper<string, string>(
    () => pendingStateOperation.value,
    () => ({
      [HOST_OPERATION.ENABLE]: t('operation:enable'),
      [HOST_OPERATION.EVACUATE]: t('operation:evacuate'),
      [HOST_OPERATION.POWER_ON]: t('operation:start'),
      [HOST_OPERATION.REBOOT]: t('operation:clean-reboot'),
      [HOST_OPERATION.SHUTDOWN]: t('operation:shutdown'),
      unknown: '',
    }),
    'unknown'
  )

  const getHostStatus = createMapper<HostState, { text: string; icon: IconName | undefined }>(
    () => ({
      running: { text: t('host:status:running'), icon: 'status:running-circle' },
      halted: { text: t('host:status:halted'), icon: 'status:halted-circle' },
      disabled: { text: t('host:status:disabled'), icon: 'status:host-disabled-circle' },
      unknown: { text: t('host:status:unknown'), icon: undefined },
    }),
    'unknown'
  )

  return {
    isMaster,
    isRunning,
    getHostStatus,
    hostState,
    powerState,
    isChangingState,
    currentOperation,
    relativeStartTime,
  }
}
