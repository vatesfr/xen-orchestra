<template>
  <MenuItem
    v-tooltip="!canEnableHost && enableHostErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canEnableHost"
    icon="status:success-circle"
    :busy="isEnablingHost"
    @click="openEnabledStateModal()"
  >
    {{ t('action:enable-host') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useHostEnabledStateToggleModal } from '@/modules/host/composables/use-host-enabled-state-toggle-modal.composable.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { ENABLED_STATE_ACTION } from '@/modules/host/types/enabled-state.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const {
  openModal: openEnabledStateModal,
  canRun: canEnableHost,
  isRunning: isEnablingHost,
  errorMessage: enableHostErrorMessage,
} = useHostEnabledStateToggleModal(ENABLED_STATE_ACTION.ENABLE, () => host)
</script>
