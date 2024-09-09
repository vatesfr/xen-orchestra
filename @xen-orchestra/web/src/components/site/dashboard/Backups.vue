<template>
  <UiCard>
    <CardTitle>{{ $t('backups') }}</CardTitle>
    <LoadingHero :disabled="isReady" type="card">
      <DonutChartWithLegend :icon="faServer" :segments :title />
      <CardNumbers :label="t('total')" :value="record?.backups?.jobs.total" size="small" />
    </LoadingHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import DonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/DonutChartWithLegend.vue'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
import UiCard from '@core/components/UiCard.vue'
import { faCircleInfo, faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { record, isReady } = useDashboardStore().subscribe()

const { t } = useI18n()

const title = computed<DonutChartWithLegendProps['title']>(() => ({
  label: t('backups.jobs'),
  iconTooltip: t('backups.jobs.based-on-last-three'),
  icon: faCircleInfo,
}))

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('backups.jobs.running-good'),
    value: record.value?.backups?.jobs.successful ?? 0,
    color: 'success',
  },
  {
    label: t('backups.jobs.at-least-one-skipped'),
    value: record.value?.backups?.jobs.skipped ?? 0,
    color: 'primary',
  },
  {
    label: t('backups.jobs.looks-like-issue'),
    value: record.value?.backups?.jobs.failed ?? 0,
    color: 'danger',
  },
  {
    label: t('backups.jobs.disabled'),
    value: record.value?.backups?.jobs.disabled ?? 0,
    color: 'disabled',
  },
])
</script>
