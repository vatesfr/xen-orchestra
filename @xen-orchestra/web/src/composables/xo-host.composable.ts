import type { IconName } from '@core/icons'
import useRelativeTime from '@core/composables/relative-time.composable'
import { parseDateTime } from '@core/utils/time.util'
import { HOST_POWER_STATE } from '@vates/types'
import { useNow } from '@vueuse/core'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoHostUtils() {
  const { t } = useI18n()

  const powerStateConfig: Record<Lowercase<HOST_POWER_STATE>, IconName | undefined> = {
    running: 'legacy:running',
    halted: 'legacy:halted',
    unknown: undefined,
  }

  function getHostState(powerState: HOST_POWER_STATE) {
    if (powerState === HOST_POWER_STATE.RUNNING) {
      return 'running'
    } else if (powerState === HOST_POWER_STATE.HALTED) {
      return 'halted'
    } else {
      return 'unknown'
    }
  }

  function getPowerState(powerState: HOST_POWER_STATE) {
    const state = toLower(powerState)

    return {
      text: t(`host-status.${state}`),
      icon: powerStateConfig[state],
    }
  }

  function getRelativeStartTime(startTime: number) {
    const date = computed(() => new Date(parseDateTime(startTime * 1000)))
    const now = useNow({ interval: 1000 })
    return useRelativeTime(date, now)
  }

  return {
    getHostState,
    getPowerState,
    getRelativeStartTime,
  }
}
