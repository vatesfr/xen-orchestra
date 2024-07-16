<template>
  <UiCard>
    <CardTitle>{{ $t('patches') }}</CardTitle>
    <DonutWithLegends :segments="serversSegments">
      <LegendTitle>{{ $t('servers') }}</LegendTitle>
    </DonutWithLegends>
    <UiSeparator />
    <DonutWithLegends :segments="hostsSegments">
      <LegendTitle>{{ $t('hosts') }}</LegendTitle>
    </DonutWithLegends>
  </UiCard>
</template>

<script setup lang="ts">
// import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import CardTitle from '@core/components/card/CardTitle.vue'
import LegendTitle from '@core/components/LegendTitle.vue'
import DonutWithLegends from '@core/components/pool/dashboard/DonutWithLegends.vue'
import UiCard from '@core/components/UiCard.vue'
import UiSeparator from '@core/components/UiSeparator.vue'
import { useFetch } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

// const { records: dashboard, isReady } = useDashboardStore().subscribe()

const { data } = useFetch<string>('/rest/v0/dashboard').get().json<{
  nHosts: number
  nPools: number
  missingPatches?: {
    nHostsWithMissingPatches: number
    nPoolsWithMissingPatches: number
  }
}>()

const serversSegments = computed(() => [
  {
    label: t('up-to-date'),
    value: data.value?.nPools ?? 0,
    color: 'success',
  },
  {
    label: t('missing-patches'),
    value: data.value?.missingPatches?.nPoolsWithMissingPatches ?? 0,
    color: 'warning',
  },
])

const hostsSegments = computed(() => [
  {
    label: t('up-to-date'),
    value: data.value?.nHosts ?? 0,
    color: 'success',
  },
  {
    label: t('missing-patches'),
    value: data.value?.missingPatches?.nHostsWithMissingPatches ?? 0,
    color: 'warning',
  },
])
</script>
