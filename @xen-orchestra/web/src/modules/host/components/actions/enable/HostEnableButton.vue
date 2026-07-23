<template>
  <MenuItem
    v-tooltip="!canEnableHost && enableHostErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canEnableHost"
    icon="status:success-circle"
    :busy="isEnablingHost"
    @click="openEnableHostModal()"
  >
    {{ t('action:enable-host') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostEnableJob } from '@/modules/host/jobs/xo-host-enable.job.ts'
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
  run: enableHost,
  canRun: canEnableHost,
  isRunning: isEnablingHost,
  errorMessage: enableHostErrorMessage,
} = useXoHostEnableJob(() => host)

const openEnableHostModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: {
    accent: 'warning',
    action: 'enable',
    object: 'host',
    hostName: host.name_label,
    icon: 'status:warning-picto',
  },
  onConfirm: () => enableHost(),
})
</script>
