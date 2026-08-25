<template>
  <MenuItem
    v-tooltip="rebootHostDisabledMessage"
    :disabled="!canRebootHost || isRestartingToolstack"
    icon="action:reboot"
    :busy="isRebootingHost"
    @click="rebootHost()"
  >
    {{ t('action:reboot') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostRebootJob } from '@/modules/host/jobs/xo-host-reboot.job.ts'
import { useXoHostRestartToolstackJob } from '@/modules/host/jobs/xo-host-restart-toolstack.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const { isRunning: isRestartingToolstack } = useXoHostRestartToolstackJob(() => host)

const {
  run,
  canRun: canRebootHost,
  isRunning: isRebootingHost,
  errorMessage: rebootHostErrorMessage,
} = useXoHostRebootJob(() => host, false)

const rebootHostDisabledMessage = computed(() => {
  if (isRestartingToolstack.value) {
    return t('job:host-restart-toolstack:in-progress')
  }

  return canRebootHost.value ? undefined : rebootHostErrorMessage.value
})

const { open: openActionModal } = useActionModal()

function rebootHost() {
  openActionModal({
    events: {
      onConfirm: () => run(),
    },
    props: {
      accent: 'info',
      action: 'reboot',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:info-picto',
    },
  })
}
</script>
