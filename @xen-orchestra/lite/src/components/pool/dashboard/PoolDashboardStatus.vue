<template>
  <UiCard class="pool-dashboard-status" :color="hasError ? 'error' : undefined">
    <UiCardTitle>{{ t('status') }}</UiCardTitle>
    <NoDataError v-if="hasError" />
    <UiCardSpinner v-else-if="!isReady" />
    <template v-else>
      <PoolDashboardStatusItem
        :active="activeHostsCount"
        :label="t('hosts')"
        :active-label="t('host.active', activeHostsCount)"
        :inactive-label="t('host.inactive', totalHostsCount - activeHostsCount)"
        :total="totalHostsCount"
      />
      <UiSeparator />
      <PoolDashboardStatusItem
        :active="activeVmsCount"
        :label="t('vms')"
        :active-label="t('vm.active', activeVmsCount)"
        :inactive-label="t('vm.inactive', totalVmsCount - activeVmsCount)"
        :total="totalVmsCount"
      />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import NoDataError from '@/components/NoDataError.vue'
import PoolDashboardStatusItem from '@/components/pool/dashboard/PoolDashboardStatusItem.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import UiSeparator from '@/components/ui/UiSeparator.vue'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { isReady: isVmReady, records: vms, hasError: hasVmError } = useVmStore().subscribe()

const {
  isReady: isHostMetricsReady,
  records: hostMetrics,
  hasError: hasHostMetricsError,
} = useHostMetricsStore().subscribe()

const hasError = computed(() => hasVmError.value || hasHostMetricsError.value)

const isReady = computed(() => isVmReady.value && isHostMetricsReady.value)

const totalHostsCount = computed(() => hostMetrics.value.length)

const activeHostsCount = computed(() => hostMetrics.value.filter(hostMetrics => hostMetrics.live).length)

const totalVmsCount = computed(() => vms.value.length)

const activeVmsCount = computed(() => vms.value.filter(vm => vm.power_state === 'Running').length)
</script>

<style lang="postcss" scoped>
.pool-dashboard-status {
  min-width: 32rem;
}
</style>
