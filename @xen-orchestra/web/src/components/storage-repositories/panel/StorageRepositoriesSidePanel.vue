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
      <StorageRepositoryInfosCard :sr />
      <StorageRepositorySpaceCard :sr />
      <StorageRepositoryVdisCard v-if="vdis.length > 0" :vdis />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import StorageRepositoryInfosCard from '@/components/storage-repositories/panel/cards/StorageRepositoryInfosCard.vue'
import StorageRepositorySpaceCard from '@/components/storage-repositories/panel/cards/StorageRepositorySpaceCard.vue'
import StorageRepositoryVdisCard from '@/components/storage-repositories/panel/cards/StorageRepositoryVdisCard.vue'
import { useXoVdiCollection } from '@/remote-resources/use-xo-vdi-collection'
import type { XoSr } from '@/types/xo/sr.type.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: XoSr
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const uiStore = useUiStore()

const { useGetVdisByIds } = useXoVdiCollection()

const vdis = useGetVdisByIds(() => sr.VDIs)
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
