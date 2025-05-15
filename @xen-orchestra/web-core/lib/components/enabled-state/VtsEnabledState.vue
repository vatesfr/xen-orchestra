<template>
  <UiInfo :accent="state.accent">
    {{ state.label }}
  </UiInfo>
</template>

<script setup lang="ts">
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
type StatesMap = Record<'enabled' | 'disabled', { label: string; accent: InfoAccent }>
const { enabled = false } = defineProps<{
  enabled?: boolean
}>()
const { t } = useI18n()
const statesMap: StatesMap = {
  enabled: { label: t('enabled'), accent: 'success' },
  disabled: { label: t('disabled'), accent: 'muted' },
}
const state = computed(() => (enabled ? statesMap.enabled : statesMap.disabled))
</script>
