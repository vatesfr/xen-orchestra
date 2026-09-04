<template>
  <MenuItem
    v-tooltip="!canStartHost && startHostErrorMessage"
    :busy="isStartingHost"
    :disabled="!canStartHost"
    icon="fa:play"
    @click="startHost()"
  >
    {{ t('action:start') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostStartJob } from '@/modules/host/jobs/host-start.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { open: openActionModal } = useActionModal()

const {
  run,
  canRun: canStartHost,
  isRunning: isStartingHost,
  errorMessage: startHostErrorMessage,
} = useHostStartJob(() => host)

function startHost() {
  return openActionModal({
    props: {
      accent: 'info',
      action: 'start',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:info-picto',
    },
    events: {
      onConfirm: async () => {
        void run()
      },
    },
  })
}
</script>
