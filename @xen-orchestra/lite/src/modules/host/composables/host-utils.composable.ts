import { HOST_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { getHostPendingStateOperation } from '@/modules/host/utils/host.util.ts'
import { useMapper } from '@core/packages/mapper'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useHostUtils(rawHost: MaybeRefOrGetter<XenApiHost | undefined>) {
  const { t } = useI18n()

  const host = toComputed(rawHost)

  const pendingStateOperation = computed(() => {
    if (host.value === undefined) {
      return undefined
    }

    return getHostPendingStateOperation(host.value)
  })

  const isChangingState = computed(() => pendingStateOperation.value !== undefined)

  const currentOperation = useMapper<string, string>(
    () => pendingStateOperation.value,
    {
      [HOST_OPERATION.EVACUATE]: t('operation:evacuate'),
      [HOST_OPERATION.REBOOT]: t('operation:clean-reboot'),
      [HOST_OPERATION.SHUTDOWN]: t('operation:shutdown'),
      unknown: '',
    },
    'unknown'
  )

  return {
    isChangingState,
    currentOperation,
  }
}
