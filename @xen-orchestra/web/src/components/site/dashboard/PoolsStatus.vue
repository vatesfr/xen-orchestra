<template>
  <UiCard>
    <UiCardTitle>{{ $t('pools-status') }}</UiCardTitle>
    <VtsLoadingHero :disabled="isReady" type="card">
      <VtsDonutChartWithLegend :icon="faCity" :segments />
      <UiCardNumbers :value="total" class="total" label="Total" size="small" />
    </VtsLoadingHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'
import { useSum } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { record, isReady } = useDashboardStore().subscribe()

const poolStatus = computed(
  () =>
    record.value?.poolsStatus ?? {
      connected: 0,
      unreachable: 0,
      unknown: 0,
    }
)

const total = useSum(() => Object.values(poolStatus.value))

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('pools-status.connected'),
    value: poolStatus.value.connected,
    accent: 'success',
  },
  {
    label: t('pools-status.unreachable'),
    value: poolStatus.value.unreachable,
    accent: 'warning',
    tooltip: t('pools-status.unreachable.tooltip'),
  },
  {
    label: t('pools-status.unknown'),
    value: poolStatus.value.unknown,
    accent: 'muted',
    tooltip: t('pools-status.unknown.tooltip'),
  },
])
</script>

<style lang="postcss" scoped>
.total {
  margin-left: auto;
}
</style>
