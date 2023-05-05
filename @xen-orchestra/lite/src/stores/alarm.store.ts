import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { defineStore } from "pinia";
import { computed } from "vue";

export const useAlarmStore = defineStore("alarm", () => {
  const messageCollection = useXapiCollectionStore().get("message");

  function subscribe() {
    const subscription = messageCollection.subscribe({ immediate: false });

    return {
      ...subscription,
      records: computed(() =>
        subscription.records.value.filter((record) => record.name === "alarm")
      ),
    };
  }

  return {
    ...messageCollection,
    subscribe,
  };
});
