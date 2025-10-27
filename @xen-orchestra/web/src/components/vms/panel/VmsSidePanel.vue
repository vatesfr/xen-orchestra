<template>
  <VtsStateHero v-if="!areVmsReady" format="panel" busy size="medium" />
  <UiPanel v-else :class="{ 'mobile-drawer': uiStore.isMobile }">
    <template #header>
      <div :class="{ 'action-buttons-container': uiStore.isMobile }">
        <UiButtonIcon
          v-tooltip="t('close')"
          size="medium"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isMobile ? 'fa:angle-left' : 'fa:close'"
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
import VmInfoCard from '@/components/vms/panel/cards/VmInfoCard.vue'
import VmNetworkCard from '@/components/vms/panel/cards/VmNetworkCard.vue'
import VmResourcesCard from '@/components/vms/panel/cards/VmResourcesCard.vue'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import type { XoVm } from '@/types/xo/vm.type.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const { areVmsReady } = useXoVmCollection()
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}

.mobile-drawer {
  position: fixed;
  inset: 0;

  .action-buttons-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}

.action-buttons {
  display: flex;
  align-items: center;
}
</style>
