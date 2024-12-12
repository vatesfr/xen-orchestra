<template>
  <UiInfo :accent="statusProps.accent">
    <span>{{ statusProps.text }}</span>
  </UiInfo>
</template>

<script setup lang="ts">
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type Status = 'connected' | 'disconnected' | 'partial'
type Accent = 'success' | 'warning' | 'danger'

const { status } = defineProps<{
  status: Status
}>()

const { t } = useI18n()

const statusMap: Record<Status, { text: string; accent: Accent }> = {
  connected: { text: t('connected'), accent: 'success' },
  disconnected: { text: t('disconnected'), accent: 'danger' },
  partial: { text: t('partially-connected'), accent: 'warning' },
}

const statusProps = computed(() => statusMap[status])
</script>
