import type { IconName } from '@core/icons'
import useRelativeTime from '@core/composables/relative-time.composable'
import { createMapper } from '@core/packages/mapper'
import { parseDateTime } from '@core/utils/time.util'
import { HOST_POWER_STATE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoHostUtils() {
  const { t } = useI18n()

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

  return {
    getPowerState,
    getRelativeStartTime,
  }
}
