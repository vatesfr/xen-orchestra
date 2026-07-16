<template>
  <MenuItem
    v-tooltip="!canShutdownHost && shutdownHostErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canShutdownHost"
    icon="action:shutdown"
    :busy="isShutdownHost"
    @click="openShutdownHostModal()"
  >
    {{ t('action:shutdown') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostShutdownJob } from '@/modules/host/jobs/xo-host-shutdown.job.ts'
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
  run: shutdownHost,
  canRun: canShutdownHost,
  isRunning: isShutdownHost,
  errorMessage: shutdownHostErrorMessage,
} = useXoHostShutdownJob(() => host)

const openShutdownHostModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: {
    accent: 'warning',
    action: 'shutdown',
    object: 'host',
    hostName: host.name_label,
    icon: 'status:warning-picto',
  },
  onConfirm: () => shutdownHost(),
})
</script>
