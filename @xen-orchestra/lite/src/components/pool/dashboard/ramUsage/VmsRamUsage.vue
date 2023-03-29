<template>
  <UiCardTitle
    :level="HEADING_LEVEL.SUBTITLE_WITH_UNERLINE"
    :left="$t('vms')"
    :right="$t('top-#', { n: N_ITEMS })"
  />
  <NoDataError v-if="hasError" />
  <UsageBar v-else :data="statFetched ? data : undefined" :n-items="N_ITEMS" />
</template>

<script lang="ts" setup>
<<<<<<< HEAD
import NoDataError from "@/components/NoDataError.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import UsageBar from "@/components/UsageBar.vue";
import { useVmCollection } from "@/stores/xen-api/vm.store";
import { formatSize, parseRamUsage } from "@/libs/utils";
=======
import { computed, inject, type ComputedRef } from "vue";
import { formatSize, parseRamUsage } from "@/libs/utils";
import { HEADING_LEVEL } from "@/components/enums";
>>>>>>> 9684aa20e (fixes)
import { IK_VM_STATS } from "@/types/injection-keys";
import { N_ITEMS } from "@/views/pool/PoolDashboardView.vue";
import { Stat } from "@/composables/fetch-stats.composable";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import UsageBar from "@/components/UsageBar.vue";
import { useVmStore } from "@/stores/vm.store";
import { VmStats } from "@/libs/xapi-stats";
import NoDataError from "@/components/NoDataError.vue";

const { hasError } = useVmCollection();

const stats = inject(
  IK_VM_STATS,
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
