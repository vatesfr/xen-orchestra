import { HOST_OPERATION } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { getHostPendingStateOperation, getHostState, type HostState } from '@/modules/host/utils/host.util.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import type { IconName } from '@core/icons'
import { createMapper, useMapper } from '@core/packages/mapper'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useHostUtils(rawHost: MaybeRefOrGetter<XenApiHost | undefined>) {
  const { t } = useI18n()

  const host = toComputed(rawHost)

  const { isHostRunning, getHostPowerState } = useHostMetricsStore().subscribe()

  const pendingStateOperation = computed(() => {
    if (host.value === undefined) {
      return undefined
    }

    return getHostPendingStateOperation(host.value, isHostRunning(host.value))
  })

  const hostState = computed<HostState>(() => {
    if (host.value === undefined) {
      return 'unknown'
    }

    return getHostState(host.value, getHostPowerState(host.value))
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
    getHostStatus,
    hostState,
    isChangingState,
    currentOperation,
  }
}
