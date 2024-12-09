<template>
  <UiInfo :accent="statusProps.accent">
    <span>{{ statusProps.text }}</span>
  </UiInfo>
</template>

<script setup lang="ts">
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { status } = defineProps<{
  status: 'connected' | 'disconnected' | 'partial'
}>()

const { t } = useI18n()

type NetworkAccent = 'success' | 'warning' | 'danger'

const statusMap: Record<string, { text: string; accent: NetworkAccent }> = {
  connected: { text: t('connected'), accent: 'success' },
  disconnected: { text: t('disconnected'), accent: 'danger' },
  partial: { text: t('partially-connected'), accent: 'warning' },
}
const statusProps = computed(() => statusMap[status])
</script>
