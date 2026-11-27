<template>
  <VtsChangeStateMenu v-if="!isCompact" placement="bottom-start">
    <VmActionPowerStateItems :vm-refs />
  </VtsChangeStateMenu>
  <VtsActionsMenu :label="t('more-actions')" size="medium">
    <VmMoreActions :vm :layout="isCompact ? 'change-state-submenu' : 'actions-only'" />
  </VtsActionsMenu>
</template>

<script lang="ts" setup>
import VmActionPowerStateItems from '@/components/vm/VmActionItems/VmActionPowerStateItems.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VmMoreActions from '@/modules/vm/components/actions/VmMoreActions.vue'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import VtsChangeStateMenu from '@core/components/menu/VtsChangeStateMenu.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { IK_PANEL_ACTIONS_COMPACT } from '@core/utils/injection-keys.util.ts'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XenApiVm
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const arePanelActionsCompact = inject(
  IK_PANEL_ACTIONS_COMPACT,
  computed(() => false)
)

const isCompact = computed(() => uiStore.isSmall || arePanelActionsCompact.value)

const vmRefs = computed(() => [vm.$ref])
</script>
