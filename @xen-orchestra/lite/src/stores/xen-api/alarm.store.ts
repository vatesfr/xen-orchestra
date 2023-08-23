import { messagesToAlarms, messageToAlarm } from "@/libs/alarm";
import { createSubscriber } from "@/stores/xen-api/create-subscriber";
import { useMessageStore } from "@/stores/xen-api/message.store";
import type { XenApiAlarm } from "@/types/xen-api";
import { defineStore, storeToRefs } from "pinia";
import { computed } from "vue";

export const useAlarmStore = defineStore("xen-api-alarm", () => {
  const messageStore = useMessageStore();

  const records = computed(() => messagesToAlarms(messageStore.records));

  const getByOpaqueRef = (opaqueRef: XenApiAlarm["$ref"]) =>
    messageToAlarm(messageStore.getByOpaqueRef(opaqueRef));

  const getByUuid = (uuid: XenApiAlarm["uuid"]) =>
    messageToAlarm(messageStore.getByUuid(uuid));

  return {
    ...messageStore,
    ...storeToRefs(messageStore),
    records,
    getByOpaqueRef,
    getByUuid,
  };
});

export const useAlarmSubscription = createSubscriber(useAlarmStore);
