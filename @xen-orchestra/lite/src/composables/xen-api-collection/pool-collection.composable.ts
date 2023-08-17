import { useXenApiCollection } from "@/composables/xen-api-collection.composable";
import type { XenApiPool } from "@/libs/xen-api";
import { computed } from "vue";

export const usePoolCollection = () => {
  const poolCollection = useXenApiCollection("pool");

  return {
    ...poolCollection,
    pool: computed<XenApiPool | undefined>(
      () => poolCollection.records.value[0]
    ),
  };
};
