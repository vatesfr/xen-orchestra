<template>
  <UiInfo :accent="currentStatus.accent">
    {{ currentStatus.label }}
  </UiInfo>
</template>

<script setup lang="ts">
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type StatusesMap = Record<'enabled' | 'disabled', { label: string; accent: InfoAccent }>

const { status } = defineProps<{
  status: boolean
}>()

const { t } = useI18n()

const statusesMap: StatusesMap = {
  enabled: { label: t('enabled'), accent: 'success' },
  disabled: { label: t('disabled'), accent: 'muted' },
}

const currentStatus = computed(() => (status ? statusesMap.enabled : statusesMap.disabled))
</script>
