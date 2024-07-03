<template v-if="isReady">
  <UiCard>
    <CardTitle>{{ $t('pools-status') }}</CardTitle>
    <DonutWithLegends :segments="segments" :icon />
    <CardNumbers label="Total" :value="pool.length" size="small" class="right" />
  </UiCard>
</template>

<script lang="ts" setup>
import DonutWithLegends from '@/components/DonutWithLegends.vue'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import type { Pool } from '@/types/pool.type'
import type { LegendColor } from '@core/types/ui-legend.type'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import UiCard from '@core/components/UiCard.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { records: pool, isReady } = usePoolStore().subscribe()

const runningPoolsCount = computed(() => {
  if (!isReady.value) return 0
  return pool.value.filter((pool: Pool) => pool.power_state === 'Running').length
})
const inactivePoolsCount = computed(() => {
  if (!isReady.value) return 0
  return pool.value.filter((pool: Pool) => pool.power_state === 'Halted').length
})
const unknownPoolsCount = computed(() => {
  if (!isReady.value) return 0
  return pool.value.filter((pool: Pool) => pool.power_state !== 'Running' && pool.power_state !== 'Halted').length
})
const segments = computed(() => [
  {
    label: t('pools-running-status'),
    value: runningPoolsCount.value,
    color: 'success' as LegendColor,
  },
  {
    label: t('pools-halted-status'),
    value: inactivePoolsCount.value,
    color: 'dark-blue' as LegendColor,
    tooltip: t('pools-halted-status-tooltip'),
  },
  {
    label: t('pools-unknown-status'),
    value: unknownPoolsCount.value,
    color: 'disabled' as LegendColor,
    tooltip: t('pools-unknown-status-tooltip'),
  },
])
const icon = faCity
</script>

<style lang="postcss" scoped>
.right {
  margin-left: auto;
}
</style>
