<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isMobile }">
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
      <VdiInfosCard :vdi :vm />
      <VdiSpaceCard :vdi />
      <VdiConfigurationCard :vdi />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import VdiConfigurationCard from '@/components/vdis/panel/cards/VdiConfigurationCard.vue'
import VdiInfosCard from '@/components/vdis/panel/cards/VdiInfosCard.vue'
import VdiSpaceCard from '@/components/vdis/panel/cards/VdiSpaceCard.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoVdi, XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{
  vdi: XoVdi
  vm: XoVm
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const uiStore = useUiStore()
</script>

<style scoped lang="postcss">
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
</style>
