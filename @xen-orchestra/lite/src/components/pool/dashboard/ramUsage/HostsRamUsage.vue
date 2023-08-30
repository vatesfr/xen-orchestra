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
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { useHostCollection } from "@/stores/xen-api/host.store";
import { IK_HOST_STATS } from "@/types/injection-keys";
import { type ComputedRef, computed, inject } from "vue";
import { UiCardTitleLevel } from "@/types/enums";
import UsageBar from "@/components/UsageBar.vue";
import { formatSize, parseRamUsage } from "@/libs/utils";
import { N_ITEMS } from "@/views/pool/PoolDashboardView.vue";
import NoDataError from "@/components/NoDataError.vue";

const { hasError } = useHostCollection();

const stats = inject(
  IK_HOST_STATS,
  computed(() => [])
);

const data = computed(() => {
  const result: {
    id: string;
    label: string;
    value: number;
    badgeLabel: string;
  }[] = [];

  stats.value.forEach((stat) => {
    if (stat.stats == null) {
      return;
    }

    const { percentUsed, total, used } = parseRamUsage(stat.stats);
    result.push({
      id: stat.id,
      label: stat.name,
      value: percentUsed,
      badgeLabel: `${formatSize(used)}/${formatSize(total)}`,
    });
  });
  return result;
});

const statFetched: ComputedRef<boolean> = computed(
  () =>
    statFetched.value ||
    (stats.value.length > 0 && stats.value.length === data.value.length)
);
</script>
