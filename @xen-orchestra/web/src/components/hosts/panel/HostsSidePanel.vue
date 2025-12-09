<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isMobile }">
    <template #header>
      <div :class="{ 'action-buttons-container': uiStore.isMobile }">
        <UiButtonIcon
          v-tooltip="t('close')"
          size="small"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isMobile ? 'fa:angle-left' : 'fa:close'"
          @click="emit('close')"
        />
      </div>
    </template>
    <template #default>
      <HostInfoCard :host />
      <HostNetworkCard :host />
      <!-- host licensing -->
      <HostSoftwareCard :host />
      <HostHardwareSpecificationsCard :host />
      <!-- host hardware health -->
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import HostHardwareSpecificationsCard from '@/components/hosts/panel/card/HostHardwareSpecificationsCard.vue'
import HostInfoCard from '@/components/hosts/panel/card/HostInfoCard.vue'
import HostNetworkCard from '@/components/hosts/panel/card/HostNetworkCard.vue'
import HostSoftwareCard from '@/components/hosts/panel/card/HostSoftwareCard.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useUiStore } from '@core/stores/ui.store'
import type { XoHost } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: XoHost
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
