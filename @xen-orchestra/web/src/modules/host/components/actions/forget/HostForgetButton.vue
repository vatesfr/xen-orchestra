<template>
  <MenuItem
    v-tooltip="!canForgetHost && forgetHostErrorMessage"
    size="medium"
    variant="tertiary"
    accent="danger"
    class="forget"
    :disabled="!canForgetHost"
    icon="action:forget"
    :busy="isForgettingHost"
    @click="openForgetHostModal()"
  >
    {{ t('action:forget-host') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostForgetJob } from '@/modules/host/jobs/xo-host-forget.job.ts'
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
  run: forgetHost,
  canRun: canForgetHost,
  isRunning: isForgettingHost,
  errorMessage: forgetHostErrorMessage,
} = useXoHostForgetJob(() => host)

const openForgetHostModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: {
    accent: 'warning',
    action: 'forget',
    object: 'host',
    hostName: host.name_label,
    icon: 'status:warning-picto',
  },
  onConfirm: () => forgetHost(),
})
</script>

<style lang="postcss" scoped>
.forget {
  color: var(--color-danger-item-base);
}
</style>
