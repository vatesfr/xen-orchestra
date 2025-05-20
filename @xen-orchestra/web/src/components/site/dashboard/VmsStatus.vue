<template>
  <UiCard>
    <UiCardTitle>{{ t('vms-status') }}</UiCardTitle>
    <VtsLoadingHero v-if="!areVmsStatusReady" type="card" />
    <template v-else>
      <VtsDonutChartWithLegend :icon="faDesktop" :segments />
      <UiCardNumbers :label="t('total')" :value="record?.vmsStatus?.total" class="total" size="small" />
    </template>
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
import { faDesktop } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { record } = useDashboardStore().subscribe()

const areVmsStatusReady = computed(() => record.value?.vmsStatus !== undefined)

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('vms-status.running'),
    value: record.value?.vmsStatus?.active ?? 0,
    accent: 'success',
  },
  {
    label: t('vms-status.inactive'),
    value: record.value?.vmsStatus?.inactive ?? 0,
    accent: 'neutral',
    tooltip: t('vms-status.inactive.tooltip'),
  },
  {
    label: t('vms-status.unknown'),
    value: record.value?.vmsStatus?.unknown ?? 0,
    accent: 'muted',
    tooltip: t('vms-status.unknown.tooltip'),
  },
])
</script>

<style lang="postcss" scoped>
.total {
  margin-left: auto;
}
</style>
