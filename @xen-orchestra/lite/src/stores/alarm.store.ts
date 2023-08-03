import type { XenApiAlarm } from "@/libs/xen-api";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import type {
  DeferExtension,
  Options,
  Subscription,
  XenApiRecordExtension,
} from "@/types/subscription";
import { defineStore } from "pinia";
import { computed } from "vue";

type Extensions = [XenApiRecordExtension<XenApiAlarm>, DeferExtension];

export const useAlarmStore = defineStore("alarm", () => {
  const messageCollection = useXapiCollectionStore().get("message");

  const subscribe = <O extends Options<Extensions>>(options?: O) => {
    const subscription = messageCollection.subscribe(options);

    const extendedSubscription = {
      records: computed(() =>
        subscription.records.value.filter((record) => record.name === "alarm")
      ),
    };

    return {
      ...subscription,
      ...extendedSubscription,
    } as Subscription<Extensions, O>;
  };

  return {
    ...messageCollection,
    subscribe,
  };
});
