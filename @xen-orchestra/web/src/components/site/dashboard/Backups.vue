<template>
  <UiCard>
    <CardTitle>{{ $t('backups') }}</CardTitle>
    <LoadingHero :disabled="isReady" type="card">
      <NoDataHero v-if="record?.backups === undefined" type="card" />
      <template v-else>
        <DonutChartWithLegend :segments="jobsSegments" :title="jobsTitle" />
        <CardNumbers :label="t('total')" :value="record?.backups?.jobs.total" size="small" />
        <Divider type="stretch" />
        <DonutChartWithLegend :segments="vmsProtectionSegments" :title="vmsProtectionTitle" />
      </template>
    </LoadingHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import Divider from '@core/components/divider/Divider.vue'
import DonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/DonutChartWithLegend.vue'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
import NoDataHero from '@core/components/state-hero/NoDataHero.vue'
import UiCard from '@core/components/UiCard.vue'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { record, isReady } = useDashboardStore().subscribe()

const { t } = useI18n()

const jobsTitle = computed<DonutChartWithLegendProps['title']>(() => ({
  label: t('backups.jobs'),
  iconTooltip: t('backups.jobs.based-on-last-three'),
  icon: faCircleInfo,
}))

const jobsSegments = computed<DonutChartWithLegendProps['segments']>(() => [
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

const vmsProtectionTitle = computed<DonutChartWithLegendProps['title']>(() => ({
  label: t('backups.vms-protection'),
  iconTooltip: t('backups.vms-protection.tooltip'),
  icon: faCircleInfo,
}))

const vmsProtectionSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('backups.vms-protection.protected'),
    value: record.value?.backups?.vmsProtection.protected ?? 0,
    color: 'success',
  },
  {
    label: t('backups.vms-protection.unprotected'),
    value: record.value?.backups?.vmsProtection.unprotected ?? 0,
    color: 'warning',
  },
  {
    label: t('backups.vms-protection.no-job'),
    value: record.value?.backups?.vmsProtection.notInJob ?? 0,
    color: 'danger',
  },
])
</script>
