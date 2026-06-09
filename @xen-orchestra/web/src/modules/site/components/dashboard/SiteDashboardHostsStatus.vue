<template>
  <UiCard :has-error>
    <UiCardTitle>
      {{ t('hosts-status') }}
      <template #info>
        <UiLink size="small" :to="{ name: '/(site)/hosts' }">{{ t('action:see-all') }}</UiLink>
      </template>
    </UiCardTitle>
    <VtsStateHero v-if="!areHostsStatusReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <template v-else>
      <VtsDonutChartWithLegend icon="object:host" :segments class="chart" @open-modal="openDisableHostModal()" />
      <UiCardNumbers :label="t('total')" :value="hostsStatus?.total" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import type { DonutChartWithLegendProps } from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsDonutChartWithLegend from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useModal } from '@core/packages/modal/use-modal'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { dashboard, hasError } = useXoSiteDashboard()

const { t } = useI18n()

const openDisableHostModal = useModal({
  component: import('@core/components/modal/VtsModal.vue'),
  props: {
    accent: 'info',
    icon: 'status:info-picto',
    dismissible: true,
    title: t('what-is-disable-host?'),
    content: t('disable-host-helper'),
  },
})

const hostsStatus = computed(() => dashboard.value.hostsStatus)

const areHostsStatusReady = computed(() => hostsStatus.value !== undefined)

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('host:status:running', 2),
    value: hostsStatus.value?.running ?? 0,
    accent: 'success',
  },
  {
    label: t('host:status:disabled', 2),
    value: hostsStatus.value?.disabled ?? 0,
    accent: 'muted',
    modalInfo: true,
  },
  {
    label: t('host:status:halted', 2),
    value: hostsStatus.value?.halted ?? 0,
    accent: 'danger',
  },
])
</script>

<style lang="postcss" scoped>
.chart {
  flex-grow: 1;
}
</style>
