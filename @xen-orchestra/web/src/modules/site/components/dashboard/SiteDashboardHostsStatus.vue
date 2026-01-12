<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('hosts-status') }}
      <template #info>
        <UiLink size="small" :to="{ name: '/(site)/hosts' }"> {{ t('action:see-all') }}</UiLink>
      </template>
    </UiCardTitle>
    <VtsStateHero v-if="!areHostsStatusReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <template v-else>
      <VtsDonutChartWithLegend icon="object:host" :segments />
      <UiCardNumbers :label="t('total')" :value="status?.total"  size="small" />
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
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { status, hasError, isReady } = defineProps<{
  status: XoDashboard['hostsStatus'] | undefined
  hasError?: boolean
  isReady?: boolean
}>()

const { t } = useI18n()

const areHostsStatusReady = computed(() => status !== undefined)

const error = computed(() => hasError || (status === undefined && isReady))

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('host:status:running', 2),
    value: status?.running ?? 0,
    accent: 'success',
  },
  {
    label: t('host:status:disabled', 2),
    value: status?.disabled ?? 0,
    accent: 'muted',
    tooltip: t('host:status:disabled'),
  },
  {
    label: t('host:status:halted', 2),
    value: status?.halted ?? 0,
    accent: 'danger',
  },
])
</script>
