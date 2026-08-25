<template>
  <MenuItem
    v-tooltip="forceRebootHostDisabledMessage"
    :disabled="!canForceRebootHost || isRestartingToolstack"
    icon="action:force-reboot"
    :busy="isForceRebootingHost"
    @click="forceRebootHost()"
  >
    {{ t('action:force-reboot') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostRebootJob } from '@/modules/host/jobs/xo-host-reboot.job.ts'
import { useXoHostRestartToolstackJob } from '@/modules/host/jobs/xo-host-restart-toolstack.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { useActionModal } from '@xen-orchestra/web-core/composables/modals/use-action-modal.ts'
import { vTooltip } from '@xen-orchestra/web-core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const { isRunning: isRestartingToolstack } = useXoHostRestartToolstackJob(() => host)

const {
  run,
  canRun: canForceRebootHost,
  isRunning: isForceRebootingHost,
  errorMessage: forceRebootHostErrorMessage,
} = useXoHostRebootJob(() => host, true)

const forceRebootHostDisabledMessage = computed(() => {
  if (isRestartingToolstack.value) {
    return t('job:host-restart-toolstack:in-progress')
  }

  return canForceRebootHost.value ? undefined : forceRebootHostErrorMessage.value
})

const { open: openActionModal } = useActionModal()

function forceRebootHost() {
  openActionModal({
    events: {
      onConfirm: () => run(),
    },
    props: {
      accent: 'info',
      action: 'force-reboot',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:info-picto',
    },
  })
}
</script>
