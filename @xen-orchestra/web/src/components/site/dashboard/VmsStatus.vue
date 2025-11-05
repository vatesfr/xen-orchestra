<template>
  <UiCard :has-error>
    <UiCardTitle>{{ t('vms-status') }}</UiCardTitle>
    <VtsStateHero v-if="!areVmsStatusReady" format="card" busy size="medium" />
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="status?.total === 0" format="card" type="no-data" size="extra-small" horizontal>
      {{ t('no-vm-detected') }}
    </VtsStateHero>
    <template v-else>
      <VtsDonutChartWithLegend icon="fa:desktop" :segments />
      <UiCardNumbers :label="t('total')" :value="status?.total" class="total" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoDashboard } from '@/types/xo/dashboard.type.ts'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { status } = defineProps<{
  status: XoDashboard['vmsStatus'] | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const areVmsStatusReady = computed(() => status !== undefined)

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('vms-status.running'),
    value: status?.active ?? 0,
    accent: 'success',
  },
  {
    label: t('vms-status.inactive'),
    value: status?.inactive ?? 0,
    accent: 'neutral',
    tooltip: t('vms-status.inactive.tooltip'),
  },
  {
    label: t('vms-status.unknown'),
    value: status?.unknown ?? 0,
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
