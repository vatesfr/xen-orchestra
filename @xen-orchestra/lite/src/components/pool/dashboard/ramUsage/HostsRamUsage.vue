<template>
  <UsageBar :data="data" :n-items="5">
    <template #header>
      <span>{{ $t("hosts") }}</span>
      <span>{{ $t("top-#", { n: 5 }) }}</span>
    </template>
  </UsageBar>
</template>

<script lang="ts" setup>
import { type ComputedRef, computed, inject } from "vue";
import UsageBar from "@/components/UsageBar.vue";
import type { Stat } from "@/composables/fetch-stats.composable";
import { formatSize, parseRamUsage } from "@/libs/utils";
import type { HostStats } from "@/libs/xapi-stats";

const stats = inject<ComputedRef<Stat<HostStats>[]>>(
  "hostStats",
  computed(() => [])
);

const data = computed<{ id: string; label: string; value: number }[]>(() => {
  const result: {
    id: string;
    label: string;
    value: number;
    badgeLabel: string;
  }[] = [];

  stats.value.forEach((stat) => {
    if (stat.stats === undefined) {
      return;
    }

    const { percentUsed, max, used } = parseRamUsage(stat.stats);
    if (percentUsed === undefined || used === undefined) {
      return;
    }

    result.push({
      id: stat.id,
      label: stat.name,
      value: percentUsed,
      badgeLabel: `${formatSize(used)}/${formatSize(max)}`,
    });
  });
  return result;
});
</script>
