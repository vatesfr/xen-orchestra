<template>
  <UiCard>
    <CardTitle>{{ $t('patches') }}</CardTitle>
    <LoadingHero :disabled="isReady" type="card">
      <DonutChartWithLegend :segments="poolsSegments" :title="poolsTitle" />
      <Divider type="stretch" />
      <DonutChartWithLegend :segments="hostsSegments" :title="hostsTitle" />
    </LoadingHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import CardTitle from '@core/components/card/CardTitle.vue'
import Divider from '@core/components/divider/Divider.vue'
import DonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/DonutChartWithLegend.vue'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
import UiCard from '@core/components/UiCard.vue'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { record, isReady } = useDashboardStore().subscribe()

const poolsTitle: ComputedRef<DonutChartWithLegendProps['title']> = computed(() => ({
  label: t('pools'),
}))

const poolsSegments: ComputedRef<DonutChartWithLegendProps['segments']> = computed(() => {
  const nPoolsWithMissingPatches = record.value?.missingPatches?.nPoolsWithMissingPatches ?? 0
  const nPools = record.value?.nPools ?? 0

  const nUpToDatePools = nPools - nPoolsWithMissingPatches

  return [
    { value: nUpToDatePools, color: 'success', label: t('up-to-date') },
    { value: nPoolsWithMissingPatches, color: 'warning', label: t('missing-patches') },
  ]
})

const hostsTitle: ComputedRef<DonutChartWithLegendProps['title']> = computed(() => ({
  label: t('hosts'),
}))

const hostsSegments = computed(() => {
  const nHostsWithMissingPatches = record.value?.missingPatches?.nHostsWithMissingPatches ?? 0
  const nHostsEol = record.value?.nHostsEol
  const nHosts = record.value?.nHosts

  const nUpToDateHosts = (nHosts ?? 0) - (nHostsWithMissingPatches + (nHostsEol ?? 0))

  const segments: DonutChartWithLegendProps['segments'] = [
    { value: nUpToDateHosts, color: 'success', label: t('up-to-date') },
    { value: nHostsWithMissingPatches, color: 'warning', label: t('missing-patches') },
  ]

  if (nHostsEol !== undefined) {
    segments.push({ value: nHostsEol, color: 'danger', label: t('eol'), tooltip: t('end-of-life') })
  }

  return segments
})
</script>
