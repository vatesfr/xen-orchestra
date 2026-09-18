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
      <VtsDonutChartWithLegend icon="object:host" :segments class="chart" />
      <UiCardNumbers :label="t('total')" :value="hostsStatus?.total" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostStatusSegments } from '@/modules/host/composables/use-host-status-segments.composable.ts'
import { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import VtsDonutChartWithLegend from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { dashboard, hasError } = useXoSiteDashboard()

const { t } = useI18n()

const hostsStatus = computed(() => dashboard.value.hostsStatus)

const areHostsStatusReady = computed(() => hostsStatus.value !== undefined)

const segments = useHostStatusSegments(hostsStatus)
</script>

<style lang="postcss" scoped>
.chart {
  flex-grow: 1;
}
</style>
