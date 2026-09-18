<template>
  <UiCard :has-error>
    <UiCardTitle>{{ t('status') }}</UiCardTitle>
    <VtsStateHero v-if="!areHostsStatusReady || !areVmsStatusReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <template v-else>
      <VtsDonutChartWithLegend :segments="hostsSegments" :title="{ label: t('hosts') }" icon="object:host" />
      <UiCardNumbers :label="t('total')" :value="poolDashboard?.hosts?.status?.total" size="small" />
      <VtsDivider type="stretch" />
      <VtsStateHero
        v-if="poolDashboard?.vms?.status?.total === 0"
        format="card"
        type="no-data"
        size="extra-small"
        horizontal
      >
        {{ t('no-vm-detected') }}
      </VtsStateHero>
      <template v-else>
        <VtsDonutChartWithLegend :segments="vmsSegments" :title="{ label: t('vms') }" icon="object:vm" />
        <UiCardNumbers :label="t('total')" :value="poolDashboard?.vms?.status?.total" size="small" />
      </template>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { useHostStatusSegments } from '@/modules/host/composables/use-host-status-segments.composable.ts'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { useVmStatusSegments } from '@/modules/vm/composables/use-vm-status-segments.composable.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsDonutChartWithLegend from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
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

const hostsSegments = useHostStatusSegments(() => poolDashboard?.hosts?.status)

const vmsSegments = useVmStatusSegments(() => poolDashboard?.vms?.status)
</script>
