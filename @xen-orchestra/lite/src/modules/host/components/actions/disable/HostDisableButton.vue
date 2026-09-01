<template>
  <MenuItem
    v-tooltip="!canDisableHost && disableHostErrorMessage"
    :busy="isDisablingHost"
    :disabled="!canDisableHost"
    icon="action:disable"
    @click="disableHost()"
  >
    {{ t('action:disable') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostDisableJob } from '@/modules/host/jobs/host-disable.job.ts'
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
  canRun: canDisableHost,
  isRunning: isDisablingHost,
  errorMessage: disableHostErrorMessage,
} = useHostDisableJob(() => host)

function disableHost() {
  return openActionModal({
    props: {
      accent: 'info',
      action: 'disable',
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
