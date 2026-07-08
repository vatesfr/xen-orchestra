<template>
  <MenuItem
    v-tooltip="!canDisableHost && disableHostErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canDisableHost"
    icon="action:disable"
    :busy="isDisablingHost"
    @click="openEnabledStateModal()"
  >
    {{ t('action:disable-host') }}
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
  canRun: canDisableHost,
  isRunning: isDisablingHost,
  errorMessage: disableHostErrorMessage,
} = useHostEnabledStateToggleModal(ENABLED_STATE_ACTION.DISABLE, () => host)
</script>
