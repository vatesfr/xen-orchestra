import type { XoHostState } from '@/modules/host/utils/xo-host.util.ts'
import type { IconName } from '@core/icons'
import useRelativeTime from '@core/composables/relative-time.composable'
import { createMapper } from '@core/packages/mapper'
import { parseDateTime } from '@core/utils/time.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoHostUtils() {
  const { t } = useI18n()

  const getStatus = createMapper<XoHostState, { text: string; icon: IconName | undefined }>(
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

  return {
    getStatus,
    getRelativeStartTime,
  }
}
