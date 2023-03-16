<template>
  <UiCardTitle
    subtitle
    :left="$t('hosts')"
    :right="$t('top-#', { n: N_ITEMS })"
  />
  <NoDataError v-if="hasError" />
  <UsageBar v-else :data="statFetched ? data : undefined" :n-items="N_ITEMS" />
</template>

<script lang="ts" setup>
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import UsageBar from "@/components/UsageBar.vue";
import type { Stat } from "@/composables/fetch-stats.composable";
import { getAvgCpuUsage } from "@/libs/utils";
import type { HostStats } from "@/libs/xapi-stats";
import { useHostStore } from "@/stores/host.store";
import { N_ITEMS } from "@/views/pool/PoolDashboardView.vue";
import { storeToRefs } from "pinia";
import { computed, type ComputedRef, inject } from "vue";
import NoDataError from "@/components/NoDataError.vue";

const { hasError } = storeToRefs(useHostStore());

const stats = inject<ComputedRef<Stat<HostStats>[]>>(
  "hostStats",
  computed(() => [])
);

const data = computed<{ id: string; label: string; value: number }[]>(() => {
  const result: { id: string; label: string; value: number }[] = [];

  stats.value.forEach((stat) => {
    if (stat.stats == null) {
      return;
    }

    const avgCpuUsage = getAvgCpuUsage(stat.stats.cpus);

    if (avgCpuUsage === undefined) {
      return;
    }

    result.push({
      id: stat.id,
      label: stat.name,
      value: avgCpuUsage,
    });
  });

  return result;
});

const statFetched: ComputedRef<boolean> = computed(() =>
  statFetched.value
    ? true
    : stats.value.length > 0 && stats.value.length === data.value.length
);
</script>
