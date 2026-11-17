<template>
  <VtsActionButton
    variant="tertiary"
    accent="brand"
    :busy="isStartingHost"
    :disabled="!canStartHost"
    icon="fa:play"
    :hint="startHostErrorMessage"
    @click="startHost()"
  >
    {{ t('action:start') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostStartJob } from '@/modules/host/jobs/host-start.job.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
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
