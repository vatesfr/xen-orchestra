<template>
  <UiInfo :accent="currentStatus.accent">
    {{ currentStatus.text }}
  </UiInfo>
</template>

<script setup lang="ts">
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

export type Status = 'enabled' | 'disabled'
type StatusesMap = Record<Status, { text: string; accent: InfoAccent }>
const { status } = defineProps<{
  status: string | boolean
}>()
const { t } = useI18n()
const getStatus = computed(() => {
  if (status === 'Running' || status === true || (typeof status === 'string' && status.trim() !== '')) {
    return 'enabled'
  } else {
    return 'disabled'
  }
})
const statuses: ComputedRef<StatusesMap> = computed(() => ({
  enabled: { text: t('enabled'), accent: 'success' },
  disabled: { text: t('disabled'), accent: 'muted' },
}))
const currentStatus = computed(() => statuses.value[getStatus.value])
</script>
