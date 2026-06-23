<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isSmall }">
    <template #header>
      <div class="panel-header" :class="{ 'action-buttons-container': uiStore.isSmall }">
        <div class="panel-actions">
          <VmChangeStateMenu :vm />
          <VmActionsMenu :vm="vm" :include="['snapshot', 'delete']" size="small" />
        </div>
        <UiButtonIcon
          v-tooltip="t('action:close')"
          size="small"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isSmall ? 'fa:angle-left' : 'fa:close'"
          @click="emit('close')"
        />
      </div>
    </template>

    <template #default>
      <VmInfoCard :vm />
      <VmNetworkCard :vm />
      <VmResourcesCard :vm />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import VmActionsMenu from '@/modules/vm/components/actions/VmActionsMenu.vue'
import VmInfoCard from '@/modules/vm/components/list/panel/cards/VmInfoCard.vue'
import VmNetworkCard from '@/modules/vm/components/list/panel/cards/VmNetworkCard.vue'
import VmResourcesCard from '@/modules/vm/components/list/panel/cards/VmResourcesCard.vue'
import VmChangeStateMenu from '@/modules/vm/components/VmChangeStateMenu.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const uiStore = useUiStore()
</script>

<style scoped lang="postcss">
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.mobile-drawer {
  position: fixed;
  inset: 0;
}
</style>
