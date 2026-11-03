<template>
  <UiPanelCard class="v2v-vm-checks-card">
    <UiPanelCardTitle size="medium" :label="t('checks')" />
    <div class="content">
      <UiInfo v-for="check of checks" :key="check.label" :accent="check.accent" wrap>{{ check.label }}</UiInfo>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { V2vAccentedLabel } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  checks: V2vAccentedLabel<InfoAccent>[]
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-vm-checks-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
