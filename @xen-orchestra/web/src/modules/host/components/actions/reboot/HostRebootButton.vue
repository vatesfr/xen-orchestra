<template>
  <MenuItem
    v-tooltip="!canRebootHost && rebootHostErrorMessage"
    accent="brand"
    :disabled="!canRebootHost"
    icon="action:reboot"
    :busy="isRebootingHost"
    @click="rebootHost()"
  >
    {{ t('action:reboot') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostRebootJob } from '@/modules/host/jobs/xo-host-reboot.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const {
  run,
  canRun: canRebootHost,
  isRunning: isRebootingHost,
  errorMessage: rebootHostErrorMessage,
} = useXoHostRebootJob(() => host, false)

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
