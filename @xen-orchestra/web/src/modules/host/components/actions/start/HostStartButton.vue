<template>
  <VtsActionButton
    variant="tertiary"
    accent="brand"
    :disabled="!canStartHost"
    icon="fa:play"
    :busy="isStartingHost"
    :hint="startHostErrorMessage"
    @click="startHost()"
  >
    {{ t('action:start') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useXoHostStartJob } from '@/modules/host/jobs/xo-host-start.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const {
  run,
  canRun: canStartHost,
  isRunning: isStartingHost,
  errorMessage: startHostErrorMessage,
} = useXoHostStartJob(() => host)

const { open: openActionModal } = useActionModal()

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
      onConfirm: () => run({ detached: true }),
    },
  })
}
</script>
