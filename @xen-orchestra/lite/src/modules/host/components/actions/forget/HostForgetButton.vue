<template>
  <MenuItem
    v-tooltip="!canForgetHost && forgetHostErrorMessage"
    :busy="isForgettingHost"
    class="host-forget-button"
    :disabled="!canForgetHost"
    icon="action:forget"
    @click="forgetHost()"
  >
    {{ t('action:forget') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostForgetJob } from '@/modules/host/jobs/host-forget.job.ts'
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
  canRun: canForgetHost,
  isRunning: isForgettingHost,
  errorMessage: forgetHostErrorMessage,
} = useHostForgetJob(() => host)

function forgetHost() {
  return openActionModal({
    props: {
      accent: 'danger',
      action: 'forget',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:danger-circle',
    },
    events: {
      onConfirm: async () => {
        void run()
      },
    },
  })
}
</script>

<style lang="postcss" scoped>
.host-forget-button {
  color: var(--color-danger-item-base);
}
</style>
