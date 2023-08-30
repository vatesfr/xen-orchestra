<template>
  <UiCardTitle
    :level="UiCardTitleLevel.SubtitleWithUnderline"
    :left="$t('hosts')"
    :right="$t('top-#', { n: N_ITEMS })"
  />
  <NoDataError v-if="hasError" />
  <UsageBar v-else :data="statFetched ? data : undefined" :n-items="N_ITEMS" />
</template>

<script lang="ts" setup>
import { computed, inject, type ComputedRef } from "vue";
import { getAvgCpuUsage } from "@/libs/utils";
import { IK_HOST_STATS } from "@/types/injection-keys";
import { N_ITEMS } from "@/views/pool/PoolDashboardView.vue";
import NoDataError from "@/components/NoDataError.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { UiCardTitleLevel } from "@/types/enums";
import UsageBar from "@/components/UsageBar.vue";
import { useHostCollection } from "@/stores/xen-api/host.store";

const { hasError } = useHostCollection();

const stats = inject(
  IK_HOST_STATS,
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
