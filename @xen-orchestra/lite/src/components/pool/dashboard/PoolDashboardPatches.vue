<template>
  <UiCard>
    <UiCardTitle>
      Patches
      <template #right>
        {{ $t("patch.missing", { n: patches.size }) }}
      </template>
    </UiCardTitle>
    <UiCardSpinner v-if="isLoading" />
    <div v-else class="table-container">
      <UiTable class="patches">
        <tr v-for="[patchId, { patch, count }] of patches" :key="patchId">
          <th>
            {{ patch.name }}
          </th>
          <td>
            <div class="version-container">
              {{ patch.version }}
              <UiCounter :value="count" class="hosts-count" color="error" />
            </div>
          </td>
        </tr>
      </UiTable>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import UiCard from "@/components/ui/UiCard.vue";
import UiCardSpinner from "@/components/ui/UiCardSpinner.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import UiCounter from "@/components/ui/UiCounter.vue";
import UiTable from "@/components/ui/UiTable.vue";
import type { XenApiPatch } from "@/libs/xen-api";
import { useHostStore } from "@/stores/host.store";
import { type Pausable, useIntervalFn } from "@vueuse/core";
import { difference } from "lodash";
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, ref, watch } from "vue";

const hostStore = useHostStore();
const { opaqueRefs: hostRefs } = storeToRefs(hostStore);

const isLoading = ref(true);
const loadersByHost = new Map<string, Pausable>();
const patchesByHost = ref(new Map<string, XenApiPatch[]>());

const patches = computed(() => {
  const results = new Map<string, { patch: XenApiPatch; count: number }>();

  const addPatchToResults = (patch: XenApiPatch) => {
    const patchId = `${patch.name}@${patch.version}`;

    if (!results.has(patchId)) {
      results.set(patchId, { patch, count: 0 });
    }

    results.get(patchId)!.count++;
  };

  patchesByHost.value.forEach((patches) =>
    patches.forEach((patch) => addPatchToResults(patch))
  );

  return results;
});

const createForHost = (hostRef: string) => {
  patchesByHost.value.set(hostRef, []);

  loadersByHost.set(
    hostRef,
    useIntervalFn(
      async () => {
        patchesByHost.value.set(
          hostRef,
          await hostStore.getMissingPatches(hostRef)
        );
        isLoading.value = false;
      },
      5000,
      { immediate: true, immediateCallback: true }
    )
  );
};

const deleteForHost = (hostRef: string) => {
  loadersByHost.get(hostRef)?.pause();
  loadersByHost.delete(hostRef);
  patchesByHost.value.delete(hostRef);
};

watch(
  hostRefs,
  (nextRefs, prevRefs) => {
    const addedRefs = difference(nextRefs, prevRefs ?? []);
    const removedRefs = difference(prevRefs ?? [], nextRefs);

    removedRefs.forEach((ref) => deleteForHost(ref));
    addedRefs.forEach((ref) => createForHost(ref));
  },
  { immediate: true, deep: true }
);

onBeforeUnmount(() => loadersByHost.forEach((loader) => loader.pause()));
</script>

<style lang="postcss" scoped>
.patches tbody th {
  border-right: none;
}

.ui-card-title {
  --section-title-right-color: var(--color-red-vates-base);
}

.version-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

.hosts-count {
  font-size: 1rem;
}

.table-container {
  overflow: auto;
  max-height: 40rem;
}
</style>
