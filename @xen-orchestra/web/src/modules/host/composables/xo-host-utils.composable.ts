import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostPendingStateOperation, getHostSmartRebootVmOperation } from '@/modules/host/utils/xo-host.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { IconName } from '@core/icons'
import useRelativeTime from '@core/composables/relative-time.composable.ts'
import { createMapper, useMapper } from '@core/packages/mapper'
import { parseDateTime } from '@core/utils/time.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoHostUtils(rawHost: MaybeRefOrGetter<FrontXoHost>) {
  const { t } = useI18n()

  const host = toComputed(rawHost)

  const { vmsByHost } = useXoVmCollection()

  const getPowerState = createMapper<HOST_POWER_STATE, { text: string; icon: IconName | undefined }>(
    {
      [HOST_POWER_STATE.RUNNING]: { text: t('host:status:running'), icon: 'status:running-circle' },
      [HOST_POWER_STATE.HALTED]: { text: t('host:status:halted'), icon: 'status:halted-circle' },
      [HOST_POWER_STATE.UNKNOWN]: { text: t('host:status:unknown'), icon: undefined },
    },
    HOST_POWER_STATE.UNKNOWN
  )

  function getRelativeStartTime(startTime: number) {
    const date = computed(() => new Date(parseDateTime(startTime * 1000)))

    return useRelativeTime(date)
  }

  const pendingStateOperation = computed(
    () =>
      getHostPendingStateOperation(host.value) ??
      getHostSmartRebootVmOperation(host.value, vmsByHost.value.get(host.value.id) ?? [])
  )

  const isChangingState = computed(() => pendingStateOperation.value !== undefined)

  const currentOperation = useMapper<string, string>(
    () => pendingStateOperation.value,
    {
      power_on: t('operation:start'),
      shutdown: t('operation:shutdown'),
      reboot: t('operation:clean-reboot'),
      evacuate: t('operation:evacuate'),
      enable: t('operation:enable'),
      suspend: t('operation:vm-suspend'),
      clean_shutdown: t('operation:vm-clean-shutdown'),
      hard_shutdown: t('operation:vm-hard-shutdown'),
      unknown: '',
    },
    'unknown'
  )

  return {
    getPowerState,
    getRelativeStartTime,
    isChangingState,
    currentOperation,
  }
}
