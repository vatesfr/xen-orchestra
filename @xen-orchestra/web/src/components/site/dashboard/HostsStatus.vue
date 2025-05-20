<template>
  <UiCard>
    <UiCardTitle>{{ $t('hosts-status') }}</UiCardTitle>
    <VtsLoadingHero v-if="!hostsStatusIsReady" type="card" />
    <template v-else>
      <VtsDonutChartWithLegend :icon="faServer" :segments />
      <UiCardNumbers :label="t('total')" :value="record?.hostsStatus.total" class="total" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import type { DonutChartWithLegendProps } from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsDonutChartWithLegend from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { record } = useDashboardStore().subscribe()

const hostsStatusIsReady = computed(() => record.value?.hostsStatus !== undefined)

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('hosts-status.running'),
    value: record.value?.hostsStatus.running ?? 0,
    accent: 'success',
  },
  {
    label: t('hosts-status.halted'),
    value: record.value?.hostsStatus.halted ?? 0,
    accent: 'warning',
  },
  {
    label: t('hosts-status.unknown'),
    value: record.value?.hostsStatus.unknown ?? 0,
    accent: 'muted',
    tooltip: t('hosts-status.unknown.tooltip'),
  },
])
</script>

<style lang="postcss" scoped>
.total {
  margin-left: auto;
}
</style>
