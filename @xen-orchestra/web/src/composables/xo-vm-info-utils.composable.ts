import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import { HOST_POWER_STATE } from '@/types/xo/host.type.ts'
import { VM_POWER_STATE, type XoVm } from '@/types/xo/vm.type.ts'
import type { IconName } from '@core/icons'
import { useTimeAgo } from '@core/composables/locale-time-ago.composable.ts'
import { useMapper } from '@core/packages/mapper'
import { parseDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoVmInfoUtils(vm: XoVm) {
  const { t, locale } = useI18n()

  const { getVmHost } = useXoVmCollection()
  const { isMasterHost } = useXoHostCollection()

  const powerState = useMapper<VM_POWER_STATE, { icon: IconName; text: string }>(
    () => vm.power_state,
    {
      [VM_POWER_STATE.RUNNING]: { icon: 'legacy:running', text: t('vm-status.running') },
      [VM_POWER_STATE.HALTED]: { icon: 'legacy:halted', text: t('vm-status.halted') },
      [VM_POWER_STATE.PAUSED]: { icon: 'legacy:paused', text: t('vm-status.paused') },
      [VM_POWER_STATE.SUSPENDED]: { icon: 'legacy:suspended', text: t('vm-status.suspended') },
    },
    VM_POWER_STATE.RUNNING
  )

  const host = computed(() => getVmHost(vm))

  const isMaster = computed(() => {
    if (host.value === undefined) {
      return false
    }

    return isMasterHost(host.value.id)
  })

  const hostPowerState = computed(() => {
    if (host.value === undefined) {
      return 'unknown'
    }

    return host.value.power_state === HOST_POWER_STATE.RUNNING ? 'running' : 'halted'
  })

  const vmTimeAgo = useTimeAgo(() => new Date(parseDateTime((vm.startTime ?? 0) * 1000)))

  const relativeStartTime = computed(() => {
    if (!vm.startTime || vm.power_state === VM_POWER_STATE.HALTED) {
      return t('not-running')
    }
    return vmTimeAgo.value
  })

  const installDateFormatted = computed(() => {
    if (!vm.installTime) {
      return t('unknown')
    }
    return new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(
      new Date(parseDateTime(vm.installTime * 1000))
    )
  })

  const guestToolsDisplay = computed(() => {
    if (vm.power_state !== VM_POWER_STATE.RUNNING) {
      return { type: 'text', value: '-' }
    }

    if (!vm.managementAgentDetected || !vm.pvDriversDetected) {
      return {
        type: 'link',
        value: t('install-guest-tools'),
        tooltip: !vm.managementAgentDetected ? t('management-agent-not-detected') : t('no-tools-detected'),
      }
    }

    if (vm.pvDriversDetected) {
      return { type: 'text', value: vm.pvDriversVersion || t('installed'), tooltip: t('installed') }
    }

    return { type: 'text', value: '-' }
  })

  return {
    powerState,
    host,
    isMaster,
    hostPowerState,
    installDateFormatted,
    relativeStartTime,
    guestToolsDisplay,
  }
}
