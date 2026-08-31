<template>
  <MenuItem
    v-tooltip="!canStartHost && startHostErrorMessage"
    :disabled="!canStartHost"
    icon="fa:play"
    :busy="isStartingHost"
    @click="startHost()"
  >
    {{ t('action:start') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostStartJob } from '@/modules/host/jobs/xo-host-start.job.ts'
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
  canRun: canStartHost,
  isRunning: isStartingHost,
  errorMessage: startHostErrorMessage,
} = useXoHostStartJob(() => host)

const { open: openActionModal } = useActionModal()

function startHost() {
  openActionModal({
    events: {
      onConfirm: () => run(),
    },
    props: {
      accent: 'info',
      action: 'start',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:info-picto',
    },
  })
}
</script>
