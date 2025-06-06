<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiCardTitle>
      {{ t('ram-usage') }}
      <template v-if="vmStatsCanBeExpired || hostStatsCanBeExpired" #right>
        <UiSpinner v-tooltip="t('fetching-fresh-data')" />
      </template>
    </UiCardTitle>
    <HostsRamUsage />
    <VmsRamUsage />
  </UiCard>
</template>

<script lang="ts" setup>
import HostsRamUsage from '@/components/pool/dashboard/ramUsage/HostsRamUsage.vue'
import VmsRamUsage from '@/components/pool/dashboard/ramUsage/VmsRamUsage.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import type { Stat } from '@/composables/fetch-stats.composable'
import type { HostStats, VmStats } from '@/libs/xapi-stats'
import { useHostStore } from '@/stores/xen-api/host.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { ComputedRef } from 'vue'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { hasError: hasVmError } = useVmStore().subscribe()
const { hasError: hasHostError } = useHostStore().subscribe()

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
