import type { IconName } from '@core/icons'
import { useTimeAgo } from '@core/composables/locale-time-ago.composable.ts'
import { useMapper } from '@core/packages/mapper'
import { parseDateTime } from '@core/utils/time.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { VM_POWER_STATE, type XoVm } from '@vates/types'
import type { MaybeRefOrGetter } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoVmUtils(rawVm: MaybeRefOrGetter<XoVm>) {
  const { t, locale } = useI18n()

  const vm = toComputed(rawVm)

  const powerState = useMapper<VM_POWER_STATE, { icon: IconName; text: string }>(
    () => vm.value.power_state,
    {
      [VM_POWER_STATE.RUNNING]: { icon: 'status:running-circle', text: t('vm:status:running') },
      [VM_POWER_STATE.HALTED]: { icon: 'status:halted-circle', text: t('vm:status:halted') },
      [VM_POWER_STATE.PAUSED]: { icon: 'status:paused-circle', text: t('vm:status:paused') },
      [VM_POWER_STATE.SUSPENDED]: { icon: 'status:suspended-circle', text: t('vm:status:suspended') },
    },
    VM_POWER_STATE.RUNNING
  )

  const vmTimeAgo = useTimeAgo(() => new Date(parseDateTime((vm.value.startTime ?? 0) * 1000)))

  const relativeStartTime = computed(() => {
    if (!vm.value.startTime || vm.value.power_state === VM_POWER_STATE.HALTED) {
      return t('not-running')
    }
    return vmTimeAgo.value
  })

  const installDateFormatted = computed(() => {
    if (!vm.value.installTime) {
      return t('unknown')
    }
    return new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(
      new Date(parseDateTime(vm.value.installTime * 1000))
    )
  })

  const hasGuestTools = (vm: XoVm) => {
    return vm.managementAgentDetected && vm.pvDriversDetected
  }

  const guestToolsDisplay = computed(() => {
    if (vm.value.power_state !== VM_POWER_STATE.RUNNING) {
      return { type: 'text', value: '-' }
    }

    if (!hasGuestTools(vm.value)) {
      return {
        type: 'link',
        value: t('action:install-guest-tools'),
        tooltip: !vm.value.managementAgentDetected ? t('management-agent-not-detected') : t('no-xen-tools-detected'),
      }
    }

    return {
      type: 'text',
      value: vm.value.pvDriversVersion || t('installed'),
      tooltip: t('installed'),
    }
  })

  return {
    powerState,
    installDateFormatted,
    relativeStartTime,
    guestToolsDisplay,
    hasGuestTools,
  }
}
