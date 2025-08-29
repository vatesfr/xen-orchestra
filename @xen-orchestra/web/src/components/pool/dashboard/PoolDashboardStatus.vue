<template>
  <UiCard :has-error>
    <UiCardTitle>{{ t('status') }}</UiCardTitle>
    <VtsStateHero v-if="!areHostsStatusReady || !areVmsStatusReady" format="card" busy />
    <VtsStateHero v-else-if="hasError" format="card" type="error" image-size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <template v-else>
      <VtsDonutChartWithLegend :segments="hostsSegments" :title="{ label: t('hosts') }" icon="fa:server" />
      <UiCardNumbers :label="t('total')" :value="poolDashboard?.hosts?.status?.total" size="small" />
      <VtsDivider type="stretch" />
      <VtsStateHero
        v-if="poolDashboard?.vms?.status?.total === 0"
        format="card"
        type="no-data"
        image-size="small"
        horizontal
      >
        {{ t('no-vm-detected') }}
      </VtsStateHero>
      <template v-else>
        <VtsDonutChartWithLegend :segments="vmsSegments" :title="{ label: t('vms', 2) }" icon="fa:display" />
        <UiCardNumbers :label="t('total')" :value="poolDashboard?.vms?.status?.total" size="small" />
      </template>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
  hasError?: boolean
}>()

const areHostsStatusReady = computed(() => poolDashboard?.hosts?.status !== undefined)
const areVmsStatusReady = computed(() => poolDashboard?.vms?.status !== undefined)

const { t } = useI18n()

const hostsSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('hosts-status.running'),
    value: poolDashboard?.hosts?.status?.running ?? 0,
    accent: 'success',
  },
  {
    label: t('disabled'),
    value: poolDashboard?.hosts?.status?.disabled ?? 0,
    accent: 'neutral',
  },
  {
    label: t('hosts-status.halted'),
    value: poolDashboard?.hosts?.status?.halted ?? 0,
    accent: 'danger',
  },
])

const vmsSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('vms-status.running'),
    value: poolDashboard?.vms?.status?.running ?? 0,
    accent: 'success',
  },
  {
    label: t('vms-status.paused'),
    value: poolDashboard?.vms?.status?.paused ?? 0,
    accent: 'info',
  },
  {
    label: t('vms-status.suspended'),
    value: poolDashboard?.vms?.status?.suspended ?? 0,
    accent: 'neutral',
  },
  {
    label: t('vms-status.halted'),
    value: poolDashboard?.vms?.status?.halted ?? 0,
    accent: 'danger',
  },
])
</script>
