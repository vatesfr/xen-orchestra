<template>
  <UiCardSpinner v-if="!areSomeLoaded" />
  <UiTable v-else class="hosts-patches-table">
    <tr v-for="patch in sortedPatches" :key="patch.$id">
      <th>{{ patch.name }}</th>
      <td>
        <div class="version">
          {{ patch.version }}
          <template v-if="hasMultipleHosts">
            <UiSpinner v-if="!areAllLoaded" />
            <UiCounter
              v-else
              v-tooltip="{
                placement: 'left',
                content: $t('n-hosts-awaiting-patch', {
                  n: patch.$hostRefs.length,
                }),
              }"
              :value="patch.$hostRefs.length"
              class="counter"
              color="error"
            />
          </template>
        </div>
      </td>
    </tr>
  </UiTable>
</template>

<script lang="ts" setup>
import UiCardSpinner from "@/components/ui/UiCardSpinner.vue";
import UiCounter from "@/components/ui/UiCounter.vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";
import UiTable from "@/components/ui/UiTable.vue";
import { vTooltip } from "@/directives/tooltip.directive";
import type { XenApiHost, XenApiPatch } from "@/libs/xen-api";
import { computed } from "vue";

const props = defineProps<{
  hostsLoadedStatus: Map<XenApiHost["$ref"], boolean>;
  patches: Map<string, XenApiPatch & { $hostRefs: XenApiHost["$ref"][] }>;
}>();

const areAllLoaded = computed(() =>
  [...props.hostsLoadedStatus.values()].every((isReady) => isReady)
);

defineExpose({
  areAllLoaded,
});

const areSomeLoaded = computed(
  () =>
    areAllLoaded.value ||
    [...props.hostsLoadedStatus.values()].some((isReady) => isReady)
);

const hasMultipleHosts = computed(() => props.hostsLoadedStatus.size > 1);

const sortedPatches = computed<
  (XenApiPatch & { $hostRefs: XenApiHost["$ref"][]; $id: string })[]
>(() =>
  Array.from(props.patches.entries())
    .map(([$id, patch]) => ({
      $id,
      ...patch,
    }))
    .sort(
      (leftPatch, rightPatch) =>
        leftPatch.changelog.date - rightPatch.changelog.date
    )
);
</script>

<style lang="postcss" scoped>
.version {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  align-items: center;
}

.counter {
  font-size: 1rem;
}
</style>
