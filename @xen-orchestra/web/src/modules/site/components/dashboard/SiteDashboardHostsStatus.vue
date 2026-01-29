<template>
  <UiCard :has-error>
    <UiCardTitle>{{ t('hosts-status') }}</UiCardTitle>
    <VtsStateHero v-if="!areHostsStatusReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <template v-else>
      <VtsDonutChartWithLegend icon="object:host" :segments />
      <UiCardNumbers :label="t('total')" :value="status?.total" class="total" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoDashboard } from '@/modules/site/types/xo-dashboard.type.ts'
import type { DonutChartWithLegendProps } from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsDonutChartWithLegend from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { status } = defineProps<{
  status: XoDashboard['hostsStatus'] | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const areHostsStatusReady = computed(() => status !== undefined)

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('host:status:running', 2),
    value: status?.running ?? 0,
    accent: 'success',
  },
  {
    label: t('host:status:halted', 2),
    value: status?.halted ?? 0,
    accent: 'warning',
  },
  {
    label: t('host:status:unknown'),
    value: status?.unknown ?? 0,
    accent: 'muted',
    tooltip: t('host:status:unknown:tooltip'),
  },
])
</script>

<style lang="postcss" scoped>
.total {
  margin-left: auto;
}
</style>
