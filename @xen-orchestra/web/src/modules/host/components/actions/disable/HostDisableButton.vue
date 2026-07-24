<template>
  <MenuItem
    v-tooltip="!canDisableHost && disableHostErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canDisableHost"
    icon="action:disable"
    :busy="isDisablingHost"
    @click="openDisableHostModal()"
  >
    {{ t('action:disable-host') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostDisableJob } from '@/modules/host/jobs/xo-host-disable.job.ts'
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
  run: disableHost,
  canRun: canDisableHost,
  isRunning: isDisablingHost,
  errorMessage: disableHostErrorMessage,
} = useXoHostDisableJob(() => host)

const { open: openActionModal } = useActionModal()

function openDisableHostModal() {
  return openActionModal({
    events: { onConfirm: () => disableHost() },
    props: {
      accent: 'warning',
      action: 'disable',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:warning-picto',
    },
  })
}
</script>
