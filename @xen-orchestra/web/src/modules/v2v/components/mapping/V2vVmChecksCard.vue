<template>
  <UiCard>
    <UiCardTitle>{{ t('checks') }}</UiCardTitle>
    <UiInfo v-for="check of checks" :key="check.label" :accent="check.accent" wrap>{{ check.label }}</UiInfo>
  </UiCard>
</template>

<script lang="ts" setup>
import type { V2vAccentedLabel } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  checks: V2vAccentedLabel<InfoAccent>[]
}>()

const { t } = useI18n()
</script>
