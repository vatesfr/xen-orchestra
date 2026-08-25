<template>
  <MenuItem
    v-tooltip="smartRebootHostDisabledMessage"
    :disabled="!canSmartRebootHost || isRestartingToolstack"
    icon="action:smart-reboot"
    :busy="isSmartRebootingHost"
    @click="smartRebootHost()"
  >
    {{ t('action:smart-reboot') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostRestartToolstackJob } from '@/modules/host/jobs/xo-host-restart-toolstack.job.ts'
import { useXoHostSmartRebootJob } from '@/modules/host/jobs/xo-host-smart-reboot.job.ts'
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
  canRun: canSmartRebootHost,
  isRunning: isSmartRebootingHost,
  errorMessage: smartRebootHostErrorMessage,
} = useXoHostSmartRebootJob(() => host)

const smartRebootHostDisabledMessage = computed(() => {
  if (isRestartingToolstack.value) {
    return t('job:host-restart-toolstack:in-progress')
  }

  return canSmartRebootHost.value ? undefined : smartRebootHostErrorMessage.value
})

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
