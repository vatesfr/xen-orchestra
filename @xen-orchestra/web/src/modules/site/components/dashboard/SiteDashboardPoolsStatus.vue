<template>
  <UiCard :has-error>
    <UiCardTitle>{{ t('pools-status') }}</UiCardTitle>
    <VtsStateHero v-if="!arePoolsStatusReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <template v-else>
      <VtsDonutChartWithLegend icon="object:pool" :segments />
      <UiCardNumbers :value="total"  :label="t('total')" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoDashboard } from '@/modules/site/types/xo-dashboard.type.ts'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useSum } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { status } = defineProps<{
  status: XoDashboard['poolsStatus'] | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const arePoolsStatusReady = computed(() => status !== undefined)

const total = useSum(() => Object.values(status ?? {}))

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('pool:status:connected', 2),
    value: status?.connected ?? 0,
    accent: 'success',
  },
  // TODO change to disconnected when available in api
  {
    label: t('pool:status:unknown'),
    value: status?.unknown ?? 0,
    accent: 'muted',
    tooltip: t('pool:status:unknown:tooltip'),
  },
  {
    label: t('pool:status:unreachable', 2),
    value: status?.unreachable ?? 0,
    accent: 'danger',
    tooltip: t('pool:status:unreachable:tooltip'),
  },
])
</script>
