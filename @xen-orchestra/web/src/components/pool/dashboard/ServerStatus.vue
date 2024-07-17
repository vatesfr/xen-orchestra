<template v-if="isReady">
  <UiCard>
    <CardTitle>{{ $t('servers-status') }}</CardTitle>
    <DonutWithLegends :icon :segments="segments" />
    <CardNumbers :value="server.length" class="right" label="Total" size="small" />
  </UiCard>
</template>

<script lang="ts" setup>
import { useServerStore } from '@/stores/xo-rest-api/server.store'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import DonutWithLegends from '@core/components/DonutWithLegends.vue'
import UiCard from '@core/components/UiCard.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { records: server, isReady } = useServerStore().subscribe()

const connectedServersCount = computed(() => {
  if (!isReady.value) return 0
  return server.value.filter(s => s.status === 'connected').length
})

const disconnectedServersCount = computed(() => {
  if (!isReady.value) return 0
  return server.value.filter(s => s.status === 'disconnected').length
})

const unknownServersCount = computed(() => {
  if (!isReady.value) return 0
  return server.value.filter(s => s.status !== 'connected' && s.status !== 'disconnected').length
})

const segments = computed(() => [
  {
    label: t('servers-connected-status'),
    value: connectedServersCount.value,
    color: 'success',
  },
  {
    label: t('servers-disconnected-status'),
    value: disconnectedServersCount.value,
    color: 'warning',
    tooltip: t('servers-disconnected-status-tooltip'),
  },
  {
    label: t('servers-unknown-status'),
    value: unknownServersCount.value,
    color: 'unknown',
    tooltip: t('servers-unknown-status-tooltip'),
  },
])
const icon = faCity
</script>

<style lang="postcss" scoped>
.right {
  margin-left: auto;
}
</style>
