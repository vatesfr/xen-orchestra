<template>
  <UiCard>
    <UiCardTitle>{{ t('patches') }}</UiCardTitle>
    <VtsLoadingHero v-if="!arePatchesReady" type="card" />
    <template v-else>
      <VtsDonutChartWithLegend :segments="poolsSegments" :title="poolsTitle" />
      <VtsDivider type="stretch" />
      <VtsDonutChartWithLegend :segments="hostsSegments" :title="hostsTitle" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { record } = useDashboardStore().subscribe()

const arePatchesReady = computed(() => record.value?.missingPatches !== undefined)

const poolsTitle: ComputedRef<DonutChartWithLegendProps['title']> = computed(() => ({
  label: t('pools'),
}))

const poolsSegments: ComputedRef<DonutChartWithLegendProps['segments']> = computed(() => {
  // @TODO: See with Clémence if `hasAuthorization === false`
  const nPoolsWithMissingPatches = record.value?.missingPatches?.hasAuthorization
    ? record.value.missingPatches.nPoolsWithMissingPatches
    : 0
  const nPools = record.value?.nPools ?? 0

  const nUpToDatePools = nPools - nPoolsWithMissingPatches

  return [
    { value: nUpToDatePools, accent: 'success', label: t('up-to-date') },
    { value: nPoolsWithMissingPatches, accent: 'warning', label: t('missing-patches') },
  ]
})

const hostsTitle: ComputedRef<DonutChartWithLegendProps['title']> = computed(() => ({
  label: t('hosts'),
}))

const hostsSegments = computed(() => {
  // @TODO: See with Clémence if `hasAuthorization === false`
  const nHostsWithMissingPatches = record.value?.missingPatches?.hasAuthorization
    ? record.value.missingPatches.nHostsWithMissingPatches
    : 0
  const nHostsEol = record.value?.nHostsEol
  const nHosts = record.value?.nHosts

  const nUpToDateHosts = (nHosts ?? 0) - (nHostsWithMissingPatches + (nHostsEol ?? 0))

  const segments: DonutChartWithLegendProps['segments'] = [
    { value: nUpToDateHosts, accent: 'success', label: t('up-to-date') },
    { value: nHostsWithMissingPatches, accent: 'warning', label: t('missing-patches') },
  ]

  if (nHostsEol !== undefined) {
    segments.push({ value: nHostsEol, accent: 'danger', label: t('eol'), tooltip: t('end-of-life') })
  }

  return segments
})
</script>
