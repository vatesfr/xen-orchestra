import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { CHANGING_STATE_OPERATIONS, isHostOperationPending } from '@/modules/host/utils/xo-host.util.ts'
import type { IconName } from '@core/icons'
import useRelativeTime from '@core/composables/relative-time.composable'
import { createMapper, useMapper } from '@core/packages/mapper'
import { parseDateTime } from '@core/utils/time.util'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoHostUtils(rawHost: MaybeRefOrGetter<FrontXoHost>) {
  const { t } = useI18n()

  const host = toComputed(rawHost)

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

  const isChangingState = computed(() => isHostOperationPending(host.value, CHANGING_STATE_OPERATIONS))

  const currentOperation = useMapper<string, string>(
    () => Object.values(host.value.current_operations)[0],
    {
      power_on: t('operation:start'),
      shutdown: t('operation:shutdown'),
      enable: t('operation:enable'),
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
