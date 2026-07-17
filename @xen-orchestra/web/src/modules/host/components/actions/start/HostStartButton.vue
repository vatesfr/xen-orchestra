<template>
  <MenuItem
    v-tooltip="!canStartHost && startHostErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canStartHost"
    icon="fa:play"
    :busy="isStartingHost"
    @click="openStartHostModal()"
  >
    {{ t('action:start') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostStartJob } from '@/modules/host/jobs/xo-host-start.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const {
  run: startHost,
  canRun: canStartHost,
  isRunning: isStartingHost,
  errorMessage: startHostErrorMessage,
} = useXoHostStartJob(() => host)

const openStartHostModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: {
    accent: 'warning',
    action: 'start',
    object: 'host',
    hostName: host.name_label,
    icon: 'status:warning-picto',
  },
  onConfirm: () => startHost(),
})
</script>
