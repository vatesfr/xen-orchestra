import type {
  ObjectType,
  ObjectTypeToRecord,
} from "@/libs/xen-api/xen-api.types";
import { useXenApiStore } from "@/stores/xen-api.store";
import { computed, ref, watch } from "vue";

export const createXenApiStore = <
  Type extends ObjectType,
  XRecord extends ObjectTypeToRecord<Type>,
>(
  type: Type
) => {
  const xenApiStore = useXenApiStore();
  const xenApi = xenApiStore.getXapi();
  const recordsByOpaqueRef = ref(new Map<string, XRecord>());
  const recordsByUuid = ref(new Map<string, XRecord>());
  const records = computed(() => Array.from(recordsByOpaqueRef.value.values()));
  const subscriptions = ref(new Set<symbol>());
  const hasSubscriptions = computed(() => subscriptions.value.size > 0);
  const isReady = ref(false);
  const isFetching = ref(false);
  const isReloading = computed(() => isReady.value && isFetching.value);
  const lastError = ref<string>();
  const hasError = computed(() => lastError.value !== undefined);

  const getByOpaqueRef = (opaqueRef: XRecord["$ref"]) => {
    return recordsByOpaqueRef.value.get(opaqueRef);
  };

  const getByUuid = (uuid: XRecord["uuid"]) => {
    return recordsByUuid.value.get(uuid);
  };

  const hasUuid = (uuid: XRecord["uuid"]) => {
    return recordsByUuid.value.has(uuid);
  };

  const add = (record: XRecord) => {
    recordsByOpaqueRef.value.set(record.$ref, record);
    recordsByUuid.value.set(record.uuid, record);
  };

  const remove = (opaqueRef: XRecord["$ref"]) => {
    const record = getByOpaqueRef(opaqueRef);

    if (record !== undefined) {
      recordsByOpaqueRef.value.delete(opaqueRef);
      recordsByUuid.value.delete(record.uuid);
    }
  };

  const onSubscriptionStart = async () => {
    isFetching.value = true;

    const records = await xenApi.loadRecords<Type, XRecord>(type);

    xenApi.addEventListener<Type, XRecord>(`${type}.add`, add);
    xenApi.addEventListener<Type, XRecord>(`${type}.mod`, add);
    xenApi.addEventListener<Type, XRecord>(`${type}.del`, remove);

    records.forEach((record) => add(record));

    isFetching.value = false;
    isReady.value = true;
  };

  const onSubscriptionEnd = () => {
    isReady.value = false;

    xenApi.removeEventListener<Type, XRecord>(`${type}.add`, add);
    xenApi.removeEventListener<Type, XRecord>(`${type}.mod`, add);
    xenApi.removeEventListener<Type, XRecord>(`${type}.del`, remove);
  };

  watch(
    () => xenApiStore.isConnected && hasSubscriptions.value,
    (hasSubscriptions) => {
      if (hasSubscriptions) {
        void onSubscriptionStart();
      } else {
        onSubscriptionEnd();
      }
    }
  );

  const subscribe = (id: symbol) => {
    subscriptions.value.add(id);
  };

  const unsubscribe = (id: symbol) => {
    subscriptions.value.delete(id);
  };

  return {
    subscribe,
    unsubscribe,
    hasSubscriptions,
    isReady,
    isFetching,
    isReloading,
    hasError,
    lastError,
    records,
    getByOpaqueRef,
    getByUuid,
    hasUuid,
  };
};
