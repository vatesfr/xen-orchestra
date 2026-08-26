import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { XoHostState } from '@/modules/host/utils/xo-host.util.ts'
import { getHostPendingStateOperation, getHostSmartRebootVmOperation } from '@/modules/host/utils/xo-host.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { IconName } from '@core/icons'
import useRelativeTime from '@core/composables/relative-time.composable.ts'
import { createMapper, useMapper } from '@core/packages/mapper'
import { parseDateTime } from '@core/utils/time.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoHostUtils(rawHost: MaybeRefOrGetter<FrontXoHost>) {
  const { t } = useI18n()

  const host = toComputed(rawHost)

  const { vmsByHost } = useXoVmCollection()

  const getHostStatus = createMapper<XoHostState, { text: string; icon: IconName | undefined }>(
    {
      running: { text: t('host:status:running'), icon: 'status:running-circle' },
      halted: { text: t('host:status:halted'), icon: 'status:halted-circle' },
      disabled: { text: t('host:status:disabled'), icon: 'status:host-disabled-circle' },
      unknown: { text: t('host:status:unknown'), icon: undefined },
    },
    'unknown'
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
    getHostStatus,
    getRelativeStartTime,
    isChangingState,
    currentOperation,
  }
}
