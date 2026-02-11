<template>
  <UiCard :has-error>
    <UiCardTitle>
      {{ t('pools-status') }}
      <template #info>
        <UiLink size="small" :to="{ name: '/(site)/pools' }">{{ t('action:see-all') }}</UiLink>
      </template>
    </UiCardTitle>
    <VtsStateHero v-if="!arePoolsStatusReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <template v-else>
      <VtsDonutChartWithLegend icon="object:pool" :segments class="chart" />
      <UiCardNumbers :label="t('total')" :value="poolsStatus?.total" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { dashboard, hasError } = useXoSiteDashboard()

const { t } = useI18n()

const poolsStatus = computed(() => dashboard.value.poolsStatus)

const arePoolsStatusReady = computed(() => poolsStatus.value !== undefined)

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('pool:status:connected', 2),
    value: poolsStatus.value?.connected ?? 0,
    accent: 'success',
  },
  {
    label: t('pool:status:disconnected', 2),
    value: poolsStatus.value?.disconnected ?? 0,
    accent: 'muted',
  },
  // TODO instead of tooltips for unreachable , we need to add a modal with a button
  {
    label: t('pool:status:unreachable', 2),
    value: poolsStatus.value?.unreachable ?? 0,
    accent: 'danger',
    tooltip: t('pool:status:unreachable:tooltip'),
  },
])
</script>

<style lang="postcss" scoped>
.chart {
  flex-grow: 1;
}
</style>
