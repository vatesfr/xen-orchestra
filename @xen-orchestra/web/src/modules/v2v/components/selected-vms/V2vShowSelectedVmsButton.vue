<template>
  <!-- Its VMs are no table selection: once closed, the panel opens again from here -->
  <UiButton
    v-if="count > 0 && !panelStore.isExpanded"
    accent="brand"
    variant="secondary"
    size="medium"
    left-icon="fa:list"
    @click="panelStore.expand()"
  >
    {{ t('selected-vms-n', { n: count }) }}
  </UiButton>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import { usePanelStore } from '@core/stores/panel.store.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  count: number
}>()

const { t } = useI18n()

const panelStore = usePanelStore()
</script>
