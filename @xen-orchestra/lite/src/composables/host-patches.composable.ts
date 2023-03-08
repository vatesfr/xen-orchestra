import type { XenApiHost, XenApiPatch } from "@/libs/xen-api";
import { useXenApiStore } from "@/stores/xen-api.store";
import {
  type MaybeComputedRef,
  type Pausable,
  useTimeoutPoll,
  watchArray,
} from "@vueuse/core";
import { computed, ref } from "vue";

export const useHostPatches = (hostRefs: MaybeComputedRef<string[]>) => {
  const xapiStore = useXenApiStore();

  const timeoutPolls = new Map<string, Pausable>();

  const patchesByHost = ref(new Map<XenApiHost["$ref"], Set<XenApiPatch>>());

  const loadedStatus = ref(new Map<XenApiHost["$ref"], boolean>());

  const patches = computed(() => {
    const records = new Map<string, XenApiPatch & { $hostRefs: string[] }>();

    patchesByHost.value.forEach((patches, hostRef) => {
      patches.forEach((patch) => {
        const id = `${patch.name}@${patch.version}`;
        const record = records.get(id);

        if (record === undefined) {
          records.set(id, {
            ...patch,
            $hostRefs: [hostRef],
          });
        } else {
          record.$hostRefs.push(hostRef);
        }
      });
    });

    return records;
  });

  const count = computed(() => patches.value.size);

  const fetchHostPatches = async (hostRef: string) => {
    if (!patchesByHost.value.has(hostRef)) {
      patchesByHost.value.set(hostRef, new Set<XenApiPatch>());
    }

    const missingPatches = await xapiStore.getXapi().getMissingPatches(hostRef);

    patchesByHost.value.get(hostRef)!.clear();

    missingPatches.forEach((missingPatch) => {
      patchesByHost.value.get(hostRef)!.add(missingPatch);
    });

    loadedStatus.value.set(hostRef, true);
  };

  const registerHost = (hostRef: string) => {
    loadedStatus.value.set(hostRef, false);

    if (timeoutPolls.has(hostRef)) {
      return timeoutPolls.get(hostRef)!.resume();
    }

    timeoutPolls.set(
      hostRef,
      useTimeoutPoll(() => fetchHostPatches(hostRef), 10000, {
        immediate: true,
      })
    );
  };

  const unregisterHost = (hostRef: string) => {
    loadedStatus.value.delete(hostRef);
    timeoutPolls.get(hostRef)?.pause();
    timeoutPolls.delete(hostRef);
    patchesByHost.value.delete(hostRef);
  };

  watchArray(
    hostRefs,
    (n, p, addedRefs, removedRefs) => {
      addedRefs.forEach(registerHost);
      removedRefs?.forEach(unregisterHost);
    },
    { immediate: true }
  );

  return { loadedStatus, patches, count };
};
