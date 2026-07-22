<template>
  <MenuItem
    v-tooltip="!canDetachHost && detachHostErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    class="detach"
    :disabled="!canDetachHost"
    icon="action:detach"
    :busy="isDetachingHost"
    @click="openForceRebootHostModal()"
  >
    {{ t('action:detach-host') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostDetachJob } from '@/modules/host/jobs/xo-host-detach.job.ts'
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
  run: detachHost,
  canRun: canDetachHost,
  isRunning: isDetachingHost,
  errorMessage: detachHostErrorMessage,
} = useXoHostDetachJob(() => host)

const openForceRebootHostModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: {
    accent: 'warning',
    action: 'detach',
    object: 'host',
    hostName: host.name_label,
    icon: 'status:warning-picto',
  },
  onConfirm: () => detachHost(),
})
</script>

<style lang="postcss" scoped>
.detach {
  color: var(--color-danger-item-base);
}
</style>
