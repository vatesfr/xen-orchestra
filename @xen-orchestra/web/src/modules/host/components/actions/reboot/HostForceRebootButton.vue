<template>
  <MenuItem
    v-tooltip="!canForceRebootHost && forceRebootHostErrorMessage"
    :disabled="!canForceRebootHost"
    icon="action:force-reboot"
    :busy="isForceRebootingHost"
    @click="rebootHost()"
  >
    {{ t('action:force-reboot') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostRebootJob } from '@/modules/host/jobs/xo-host-reboot.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.js'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { useActionModal } from '@xen-orchestra/web-core/composables/modals/use-action-modal.ts'
import { vTooltip } from '@xen-orchestra/web-core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const {
  run,
  canRun: canForceRebootHost,
  isRunning: isForceRebootingHost,
  errorMessage: forceRebootHostErrorMessage,
} = useXoHostRebootJob(() => host, true)

const { open: openActionModal } = useActionModal()

function rebootHost() {
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
