<template>
  <VtsChangeStateMenu v-if="!isCompact" placement="bottom-start">
    <VmPowerStateActions :vm />
  </VtsChangeStateMenu>
  <VtsActionsMenu :label="t('more-actions')" size="medium">
    <VmMoreActions :vm :layout="isCompact ? 'change-state-submenu' : 'actions-only'" />
  </VtsActionsMenu>
</template>

<script lang="ts" setup>
import VmMoreActions from '@/modules/vm/components/actions/VmMoreActions.vue'
import VmPowerStateActions from '@/modules/vm/components/actions/VmPowerStateActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import VtsChangeStateMenu from '@core/components/menu/VtsChangeStateMenu.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { IK_PANEL_ACTIONS_COMPACT } from '@core/utils/injection-keys.util.ts'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const arePanelActionsCompact = inject(
  IK_PANEL_ACTIONS_COMPACT,
  computed(() => false)
)

const isCompact = computed(() => uiStore.isSmall || arePanelActionsCompact.value)
</script>
