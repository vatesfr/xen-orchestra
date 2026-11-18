<template>
  <VtsChangeStateMenu v-if="!isCompact" placement="bottom-start">
    <HostPowerStateActions :host />
  </VtsChangeStateMenu>
  <VtsActionsMenu :label="t('more-actions')" size="medium">
    <HostMoreActions :host :layout="isCompact ? 'change-state-submenu' : 'actions-only'" />
  </VtsActionsMenu>
</template>

<script lang="ts" setup>
import HostPowerStateActions from '@/modules/host/components/actions/HostPowerStateActions.vue'
import HostMoreActions from '@/modules/host/components/HostMoreActions.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import VtsChangeStateMenu from '@core/components/menu/VtsChangeStateMenu.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { IK_PANEL_ACTIONS_COMPACT } from '@core/utils/injection-keys.util.ts'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const arePanelActionsCompact = inject(
  IK_PANEL_ACTIONS_COMPACT,
  computed(() => false)
)

const isCompact = computed(() => uiStore.isSmall || arePanelActionsCompact.value)
</script>
