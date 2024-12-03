<template>
  <UiInfo class="text-ellipsis" :accent="statusProps.accent">
    <span class="text-ellipsis">{{ statusProps.text }}</span>
  </UiInfo>
</template>

<script setup lang="ts">
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'

const { pif } = defineProps<{
  pif: { status: 'connected' | 'disconnected' | 'partially_connected' }
}>()

type NetworkAccent = 'success' | 'warning' | 'danger'

const statusMap: Record<string, { text: string; accent: NetworkAccent }> = {
  connected: { text: 'Connected', accent: 'success' },
  disconnected: { text: 'Disconnected', accent: 'danger' },
  partially_connected: { text: 'Partially Connected', accent: 'warning' },
}

const statusProps = computed(() => statusMap[pif.status])
</script>
