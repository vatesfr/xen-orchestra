<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiCardTitle>
      {{ $t('cpu-usage') }}
      <template v-if="vmStatsCanBeExpired || hostStatsCanBeExpired" #right>
        <UiSpinner v-tooltip="$t('fetching-fresh-data')" />
      </template>
    </UiCardTitle>
    <HostsCpuUsage />
    <VmsCpuUsage />
  </UiCard>
</template>
<script lang="ts" setup>
import { useHostCollection } from '@/stores/xen-api/host.store'
import { useVmCollection } from '@/stores/xen-api/vm.store'
import { vTooltip } from '@/directives/tooltip.directive'
import HostsCpuUsage from '@/components/pool/dashboard/cpuUsage/HostsCpuUsage.vue'
import VmsCpuUsage from '@/components/pool/dashboard/cpuUsage/VmsCpuUsage.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import { computed, inject, type ComputedRef } from 'vue'
import type { Stat } from '@/composables/fetch-stats.composable'
import type { HostStats, VmStats } from '@/libs/xapi-stats'
import UiSpinner from '@/components/ui/UiSpinner.vue'

const { hasError: hasVmError } = useVmCollection()
const { hasError: hasHostError } = useHostCollection()

const vmStats = inject<ComputedRef<Stat<VmStats>[]>>(
  'vmStats',
  computed(() => [])
)

const hostStats = inject<ComputedRef<Stat<HostStats>[]>>(
  'hostStats',
  computed(() => [])
)

const vmStatsCanBeExpired = computed(() => vmStats.value.some(stat => stat.canBeExpired))

const hostStatsCanBeExpired = computed(() => hostStats.value.some(stat => stat.canBeExpired))

const hasError = computed(() => hasVmError.value || hasHostError.value)
</script>
