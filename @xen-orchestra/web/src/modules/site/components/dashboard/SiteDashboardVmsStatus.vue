<template>
  <UiCard :has-error>
    <UiCardTitle>
      {{ t('vms-status') }}
      <template #info>
        <UiLink size="small" :to="{ name: '/(site)/vms' }">{{ t('action:see-all') }}</UiLink>
      </template>
    </UiCardTitle>
    <VtsStateHero v-if="!areVmsStatusReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="vmsStatus?.total === 0" format="card" type="no-data" size="extra-small" horizontal>
      {{ t('no-vm-detected') }}
    </VtsStateHero>
    <template v-else>
      <VtsDonutChartWithLegend icon="fa:desktop" :segments class="chart" />
      <UiCardNumbers :label="t('total')" :value="vmsStatus?.total" size="small" />
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

const vmsStatus = computed(() => dashboard.value.vmsStatus)

const areVmsStatusReady = computed(() => vmsStatus.value !== undefined)

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('vm:status:running', 2),
    value: vmsStatus.value?.running ?? 0,
    accent: 'success',
  },
  {
    label: t('vm:status:paused', 2),
    value: vmsStatus.value?.paused ?? 0,
    accent: 'info',
  },
  {
    label: t('vm:status:suspended', 2),
    value: vmsStatus.value?.suspended ?? 0,
    accent: 'neutral',
  },
  {
    label: t('vm:status:halted', 2),
    value: vmsStatus.value?.halted ?? 0,
    accent: 'danger',
  },
])
</script>

<style lang="postcss" scoped>
.chart {
  flex-grow: 1;
}
</style>
