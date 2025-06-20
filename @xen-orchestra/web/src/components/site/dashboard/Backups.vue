<template>
  <UiCard>
    <UiCardTitle>{{ t('backups') }}</UiCardTitle>
    <VtsLoadingHero v-if="!areBackupsReady" type="card" />
    <VtsNoDataHero v-else-if="backups === undefined" type="card" />
    <template v-else>
      <VtsDonutChartWithLegend :segments="jobsSegments" :title="jobsTitle" />
      <UiCardNumbers :label="t('total')" :value="backups.jobs.total" size="small" />
      <VtsDivider type="stretch" />
      <VtsDonutChartWithLegend :segments="vmsProtectionSegments" :title="vmsProtectionTitle" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoDashboard } from '@/types/xo/dashboard.type.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backups } = defineProps<{
  backups: XoDashboard['backups'] | undefined
}>()

const areBackupsReady = computed(() => backups?.jobs !== undefined && backups?.vmsProtection !== undefined)

const { t } = useI18n()

const jobsTitle = computed<DonutChartWithLegendProps['title']>(() => ({
  label: t('backups.jobs'),
  iconTooltip: t('backups.jobs.based-on-last-three'),
  icon: 'fa:info-circle',
}))

const jobsSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('backups.jobs.running-good'),
    value: backups?.jobs.successful ?? 0,
    accent: 'success',
  },
  {
    label: t('backups.jobs.at-least-one-skipped'),
    value: backups?.jobs.skipped ?? 0,
    accent: 'info',
  },
  {
    label: t('backups.jobs.looks-like-issue'),
    value: backups?.jobs.failed ?? 0,
    accent: 'danger',
  },
  {
    label: t('backups.jobs.disabled'),
    value: backups?.jobs.disabled ?? 0,
    accent: 'muted',
  },
])

const vmsProtectionTitle = computed<DonutChartWithLegendProps['title']>(() => ({
  label: t('backups.vms-protection'),
  iconTooltip: t('backups.vms-protection.tooltip'),
  icon: 'fa:info-circle',
}))

const vmsProtectionSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('backups.vms-protection.protected'),
    value: backups?.vmsProtection.protected ?? 0,
    accent: 'success',
  },
  {
    label: t('backups.vms-protection.unprotected'),
    value: backups?.vmsProtection.unprotected ?? 0,
    accent: 'warning',
  },
  {
    label: t('backups.vms-protection.no-job'),
    value: backups?.vmsProtection.notInJob ?? 0,
    accent: 'danger',
  },
])
</script>
