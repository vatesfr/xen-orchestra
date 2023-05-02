<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiCardTitle>{{ $t("status") }}</UiCardTitle>
    <NoDataError v-if="hasError" />
    <UiCardSpinner v-else-if="!isReady" />
    <template v-else>
      <PoolDashboardStatusItem
        :active="activeHostsCount"
        :label="$t('hosts')"
        :total="totalHostsCount"
      />
      <UiSeparator />
      <PoolDashboardStatusItem
        :active="activeVmsCount"
        :label="$t('vms')"
        :total="totalVmsCount"
      />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import NoDataError from "@/components/NoDataError.vue";
import PoolDashboardStatusItem from "@/components/pool/dashboard/PoolDashboardStatusItem.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardSpinner from "@/components/ui/UiCardSpinner.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import UiSeparator from "@/components/ui/UiSeparator.vue";
import { useHostMetricsStore } from "@/stores/host-metrics.store";
import { useVmStore } from "@/stores/vm.store";
import { computed } from "vue";

const {
  isReady: isVmReady,
  records: vms,
  hasError: hasVmError,
  runningVms,
} = useVmStore().subscribe();

const {
  isReady: isHostMetricsReady,
  records: hostMetrics,
  hasError: hasHostMetricsError,
} = useHostMetricsStore().subscribe();

const hasError = computed(() => hasVmError.value || hasHostMetricsError.value);

const isReady = computed(() => isVmReady.value && isHostMetricsReady.value);

const totalHostsCount = computed(() => hostMetrics.value.length);

const activeHostsCount = computed(
  () => hostMetrics.value.filter((hostMetrics) => hostMetrics.live).length
);

const totalVmsCount = computed(() => vms.value.length);

const activeVmsCount = computed(() => runningVms.value.length);
</script>
