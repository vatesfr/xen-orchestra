import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { createSubscribe } from "@/types/xapi-collection";
import { defineStore } from "pinia";
import { computed } from "vue";

export const useAlarmStore = defineStore("alarm", () => {
  const messageCollection = useXapiCollectionStore().get("message");

  const subscribe = createSubscribe<"message", []>((options) => {
    const originalSubscription = messageCollection.subscribe(options);

    const extendedSubscription = {
      records: computed(() =>
        originalSubscription.records.value.filter(
          (record) => record.name === "alarm"
        )
      ),
    };

    return {
      ...originalSubscription,
      ...extendedSubscription,
    };
  });

  return {
    ...messageCollection,
    subscribe,
  };
});
