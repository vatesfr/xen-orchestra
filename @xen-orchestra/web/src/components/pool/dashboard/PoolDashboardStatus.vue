<template>
  <UiCard class="record-dashboard-vms-status">
    <UiCardTitle>{{ t('status') }}</UiCardTitle>
    <VtsLoadingHero v-if="!areHostsStatusReady && !areVmsStatusReady" type="card" />
    <template v-else>
      <VtsDonutChartWithLegend :segments="segmentsHost" :title="{ label: t('hosts') }" :icon="faServer" />
      <UiCardNumbers class="total" :label="t('total')" :value="record?.hosts.status?.total" size="small" />
      <VtsDivider type="stretch" />
      <VtsDonutChartWithLegend :segments="segmentsVm" :title="{ label: t('vms', 2) }" :icon="faDisplay" />
      <UiCardNumbers class="total" :label="t('total')" :value="record?.vms.status?.total" size="small" />
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { usePoolDashboardStore } from '@/stores/xo-rest-api/pool-dashboard.store.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { faDisplay, faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { record } = usePoolDashboardStore().subscribe()

const areHostsStatusReady = computed(() => record.value?.hosts.status !== undefined)
const areVmsStatusReady = computed(() => record.value?.vms.status !== undefined)

const { t } = useI18n()

const segmentsHost = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('vms-status.running'),
    value: record?.value?.hosts.status.running ?? 0,
    accent: 'success',
  },
  {
    label: t('vms-status.suspended'),
    value: record?.value?.hosts.status.disabled ?? 0,
    accent: 'neutral',
  },
  {
    label: t('vms-status.halted'),
    value: record?.value?.hosts.status.halted ?? 0,
    accent: 'danger',
  },
])

const segmentsVm = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('vms-status.running'),
    value: record?.value?.vms.status.running ?? 0,
    accent: 'success',
  },
  {
    label: t('vms-status.paused'),
    value: record?.value?.vms.status.paused ?? 0,
    accent: 'info',
  },
  {
    label: t('vms-status.suspended'),
    value: record?.value?.vms.status.suspended ?? 0,
    accent: 'neutral',
  },
  {
    label: t('vms-status.halted'),
    value: record?.value?.vms.status.halted ?? 0,
    accent: 'danger',
  },
])
</script>
