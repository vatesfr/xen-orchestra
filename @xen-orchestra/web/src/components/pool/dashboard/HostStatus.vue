<template v-if="isReady">
  <UiCard>
    <CardTitle>{{ $t('hosts-status') }}</CardTitle>
    <DonutWithLegends :segments="segments" :icon />
    <CardNumbers label="Total" :value="host.length" size="small" class="right" />
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { Host } from '@/types/host.type'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import DonutWithLegends from '@core/components/DonutWithLegends.vue'
import UiCard from '@core/components/UiCard.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { records: host, isReady } = useHostStore().subscribe()

const runningHostsCount = computed(() => {
  if (!isReady.value) return 0
  return host.value.filter((host: Host) => host.power_state === 'Running').length
})
const inactiveHostsCount = computed(() => {
  if (!isReady.value) return 0
  return host.value.filter((host: Host) => host.power_state === 'Halted').length
})
const unknownHostsCount = computed(() => {
  if (!isReady.value) return 0
  return host.value.filter((host: Host) => host.power_state !== 'Running' && host.power_state !== 'Halted').length
})
const segments = computed(() => [
  {
    label: t('hosts-running-status'),
    value: runningHostsCount.value,
    color: 'success',
  },
  {
    label: t('hosts-halted-status'),
    value: inactiveHostsCount.value,
    color: 'warning',
    tooltip: t('hosts-halted-status-tooltip'),
  },
  {
    label: t('hosts-unknown-status'),
    value: unknownHostsCount.value,
    color: 'unknown',
    tooltip: t('hosts-unknown-status-tooltip'),
  },
])
const icon = faServer
</script>

<style lang="postcss" scoped>
.right {
  margin-left: auto;
}
</style>
