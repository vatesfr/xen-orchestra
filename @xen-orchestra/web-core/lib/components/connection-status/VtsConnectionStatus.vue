<template>
  <UiInfo :accent="currentStatus.accent">
    {{ currentStatus.text }}
  </UiInfo>
</template>

<script setup lang="ts">
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'partially-connected'
  | 'disconnected-from-physical-device'
  | 'physically-disconnected'
type ConnectionStatusesMap = Record<ConnectionStatus, { text: string; accent: InfoAccent }>

const { status } = defineProps<{
  status: ConnectionStatus
}>()

const { t } = useI18n()

const statuses: ComputedRef<ConnectionStatusesMap> = computed(() => ({
  connected: { text: t('connected'), accent: 'success' },
  disconnected: { text: t('disconnected'), accent: 'danger' },
  'partially-connected': { text: t('partially-connected'), accent: 'warning' },
  'disconnected-from-physical-device': { text: t('disconnected-from-physical-device'), accent: 'warning' },
  // This status is used in host pif side panel
  'physically-disconnected': { text: t('disconnected-from-physical-device'), accent: 'danger' },
}))

const currentStatus = computed(() => statuses.value[status])
</script>
