<template>
  <UiInfo :accent="state.accent">
    {{ state.label }}
  </UiInfo>
</template>

<script setup lang="ts">
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type StatesMap = { label: string; accent: InfoAccent }


const { enabled } = defineProps<{
  enabled: boolean
}>()

const { t } = useI18n()

const state = computed<StatesMap>(() =>
  enabled ? { label: t('enabled'), accent: 'success' } : { label: t('disabled'), accent: 'muted' }
)
</script>
