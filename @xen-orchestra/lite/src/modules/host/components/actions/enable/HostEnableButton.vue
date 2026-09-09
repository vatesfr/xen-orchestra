<template>
  <MenuItem
    v-tooltip="!canEnableHost && enableHostErrorMessage"
    :busy="isEnablingHost"
    :disabled="!canEnableHost"
    icon="status:success-circle"
    @click="enableHost()"
  >
    {{ t('action:enable') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostEnableJob } from '@/modules/host/jobs/host-enable.job.ts'
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
  canRun: canEnableHost,
  isRunning: isEnablingHost,
  errorMessage: enableHostErrorMessage,
} = useHostEnableJob(() => host)

function enableHost() {
  return openActionModal({
    props: {
      accent: 'info',
      action: 'enable',
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
