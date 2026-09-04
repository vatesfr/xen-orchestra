<template>
  <MenuItem
    v-tooltip="!canSmartRebootHost && smartRebootHostErrorMessage"
    accent="brand"
    :disabled="!canSmartRebootHost"
    icon="action:smart-reboot"
    :busy="isSmartRebootingHost"
    @click="smartRebootHost()"
  >
    {{ t('action:smart-reboot') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostSmartRebootJob } from '@/modules/host/jobs/xo-host-smart-reboot.job.ts'
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
  canRun: canSmartRebootHost,
  isRunning: isSmartRebootingHost,
  errorMessage: smartRebootHostErrorMessage,
} = useXoHostSmartRebootJob(() => host)

const { open: openActionModal } = useActionModal()

async function smartRebootHost() {
  const { event } = await openActionModal({
    props: {
      accent: 'info',
      action: 'smart-reboot',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:info-picto',
    },
  })

  if (event !== 'onConfirm') {
    return
  }

  await run()
}
</script>
