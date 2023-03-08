<template>
  <UiCardSpinner v-if="!areSomeLoaded" />
  <UiTable v-else class="hosts-patches-table">
    <tr v-for="[patchId, patch] in patches" :key="patchId">
      <th>{{ patch.name }}</th>
      <td>
        <div class="version">
          {{ patch.version }}
          <template v-if="hasMultipleHosts">
            <UiSpinner v-if="!areAllLoaded" />
            <UiCounter
              class="counter"
              v-else
              :value="patch.$hostRefs.length"
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
import type { XenApiHost, XenApiPatch } from "@/libs/xen-api";
import { computed } from "vue";

const props = defineProps<{
  hostsLoadedStatus: Map<XenApiHost["$ref"], boolean>;
  patches: Map<string, XenApiPatch & { $hostRefs: XenApiHost["$ref"][] }>;
}>();

const areAllLoaded = computed(() => {
  return [...props.hostsLoadedStatus.values()].every((isReady) => isReady);
});

const areSomeLoaded = computed(() => {
  return (
    areAllLoaded.value ||
    [...props.hostsLoadedStatus.values()].some((isReady) => isReady)
  );
});

const hasMultipleHosts = computed(() => {
  return props.hostsLoadedStatus.size > 1;
});
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
