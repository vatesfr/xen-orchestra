<template>
  <!-- On a small screen the panel stays closed, not to cover the step, until opened from here -->
  <UiButton
    v-if="!panelStore.isExpanded"
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
