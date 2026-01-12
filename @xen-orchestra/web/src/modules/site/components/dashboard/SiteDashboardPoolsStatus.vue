<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('pools-status') }}
      <template #info>
        <UiLink size="small" :to="{ name: '/(site)/pools' }"> {{ t('action:see-all') }}</UiLink>
      </template>
    </UiCardTitle>
    <VtsStateHero v-if="!arePoolsStatusReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <template v-else>
      <VtsDonutChartWithLegend icon="object:pool" :segments />
      <UiCardNumbers :label="t('total')" :value="status?.total" size="small" />
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
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { status, hasError, isReady } = defineProps<{
  status: XoDashboard['poolsStatus'] | undefined
  hasError?: boolean
  isReady?: boolean
}>()

const { t } = useI18n()

const arePoolsStatusReady = computed(() => status !== undefined)

const error = computed(() => hasError || (status === undefined && isReady))

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('pool:status:connected', 2),
    value: status?.connected ?? 0,
    accent: 'success',
  },
  {
    label: t('pool:status:disconnected', 2),
    value: status?.disconnected ?? 0,
    accent: 'muted',
  },
  {
    label: t('pool:status:unreachable', 2),
    value: status?.unreachable ?? 0,
    accent: 'danger',
    tooltip: t('pool:status:unreachable:tooltip'),
  },
])
</script>
