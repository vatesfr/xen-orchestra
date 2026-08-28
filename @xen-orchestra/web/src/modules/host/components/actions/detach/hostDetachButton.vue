<template>
  <MenuItem
    v-tooltip="!canDetachHost && detachHostErrorMessage"
    class="detach"
    :disabled="!canDetachHost"
    icon="action:detach"
    :busy="isDetachingHost"
    @click="detachHost()"
  >
    {{ t('action:detach-host') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostDetachJob } from '@/modules/host/jobs/xo-host-detach.job.ts'
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
  canRun: canDetachHost,
  isRunning: isDetachingHost,
  errorMessage: detachHostErrorMessage,
} = useXoHostDetachJob(() => host)

const { open: openActionModal } = useActionModal()

function detachHost() {
  return openActionModal({
    props: {
      accent: 'warning',
      action: 'detach',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:warning-picto',
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
.detach {
  color: var(--color-warning-txt-base);
}
</style>
