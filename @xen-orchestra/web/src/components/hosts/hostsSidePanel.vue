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
      <HostDefaultCard :host />
      <HostNetworkCard :host />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import type { XoHost } from '@/types/xo/host.type'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useUiStore } from '@core/stores/ui.store'
import { useI18n } from 'vue-i18n'
import HostDefaultCard from './card/HostDefaultCard.vue'
import HostNetworkCard from './card/HostNetworkCard.vue'

const { host } = defineProps<{
  host: XoHost
}>()

const emit = defineEmits<{
  close: []
}>()
const { t } = useI18n()
const uiStore = useUiStore()
</script>
