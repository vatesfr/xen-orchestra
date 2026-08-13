<template>
  <MenuItem
    v-tooltip="!canForgetHost && forgetHostErrorMessage"
    class="forget"
    :disabled="!canForgetHost"
    icon="action:forget"
    :busy="isForgettingHost"
    @click="forgetHost()"
  >
    {{ t('action:forget') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostForgetJob } from '@/modules/host/jobs/xo-host-forget.job.ts'
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
  canRun: canForgetHost,
  isRunning: isForgettingHost,
  errorMessage: forgetHostErrorMessage,
} = useXoHostForgetJob(() => host)

const { open: openActionModal } = useActionModal()

function forgetHost() {
  openActionModal({
    events: {
      onConfirm: () => run(),
    },
    props: {
      accent: 'danger',
      action: 'forget',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:danger-circle',
    },
  })
}
</script>

<style lang="postcss" scoped>
.forget {
  color: var(--color-danger-item-base);
}
</style>
