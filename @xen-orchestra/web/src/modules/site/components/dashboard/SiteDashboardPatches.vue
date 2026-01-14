<template>
  <UiCard :has-error="isError">
    <UiCardTitle>{{ t('patches') }}</UiCardTitle>
    <VtsStateHero v-if="isLoading" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="isError" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <template v-else>
      <VtsDonutChartWithLegend :segments="poolsSegments" :title="poolsTitle" />
      <VtsDivider type="stretch" />
      <VtsDonutChartWithLegend :segments="hostsSegments" :title="hostsTitle" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { isDefined } from '@vueuse/shared'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { dashboard, hasError } = useXoSiteDashboard()

const { t } = useI18n()

const isLoading = computed(() => dashboard.value.missingPatches === undefined)

const missingPatches = computed(() => {
  if (isLoading.value || !('nPools' in dashboard.value.missingPatches!)) {
    return
  }

  return dashboard.value.missingPatches
})

const isError = computed(() => {
  if (hasError.value) {
    return true
  }
  if (isLoading.value || !isDefined(missingPatches.value)) {
    return false
  }

  return 'error' in missingPatches.value || !missingPatches.value.hasAuthorization
})

const poolsTitle: ComputedRef<DonutChartWithLegendProps['title']> = computed(() => ({
  label: t('pools'),
}))

const poolsSegments: ComputedRef<DonutChartWithLegendProps['segments']> = computed(() => {
  if (isLoading.value || !isDefined(missingPatches.value)) {
    return []
  }

  const nUpToDatePools = missingPatches.value.nPools - missingPatches.value.nPoolsWithMissingPatches

  return [
    { value: nUpToDatePools, accent: 'success', label: t('up-to-date') },
    { value: missingPatches.value.nPoolsWithMissingPatches, accent: 'warning', label: t('missing-patches') },
  ]
})

const hostsTitle: ComputedRef<DonutChartWithLegendProps['title']> = computed(() => ({
  label: t('hosts'),
}))

const hostsSegments = computed(() => {
  if (isLoading.value || !isDefined(missingPatches.value)) {
    return []
  }

  const nUpToDateHosts = missingPatches.value.nHosts - missingPatches.value.nHostsWithMissingPatches

  const segments: DonutChartWithLegendProps['segments'] = [
    { value: nUpToDateHosts, accent: 'success', label: t('up-to-date') },
    { value: missingPatches.value.nHostsWithMissingPatches, accent: 'warning', label: t('missing-patches') },
  ]

  if (typeof missingPatches.value.nHostsEol === 'number') {
    segments.push({
      value: missingPatches.value.nHostsEol,
      accent: 'danger',
      label: t('eol'),
      tooltip: t('end-of-life'),
    })
  }

  return segments
})
</script>
