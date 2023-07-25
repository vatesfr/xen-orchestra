import type { RawObjectType } from "@/libs/xen-api";
import { useXenApiStore } from "@/stores/xen-api.store";
import type {
  RawTypeToRecord,
  SubscribeOptions,
  Subscription,
} from "@/types/xapi-collection";
import { tryOnUnmounted, whenever } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, readonly, ref } from "vue";

export const useXapiCollectionStore = defineStore("xapiCollection", () => {
  const collections = ref(new Map());

  function get<T extends RawObjectType>(
    type: T
  ): ReturnType<typeof createXapiCollection<T, RawTypeToRecord<T>>> {
    if (!collections.value.has(type)) {
      collections.value.set(type, createXapiCollection(type));
    }

    return collections.value.get(type)!;
  }

  return { get };
});

const createXapiCollection = <
  T extends RawObjectType,
  R extends RawTypeToRecord<T>
>(
  type: T
) => {
  const isReady = ref(false);
  const isFetching = ref(false);
  const isReloading = computed(() => isReady.value && isFetching.value);
  const lastError = ref<string>();
  const hasError = computed(() => lastError.value !== undefined);
  const subscriptions = ref(new Set<symbol>());
  const recordsByOpaqueRef = ref(new Map<R["$ref"], R>());
  const recordsByUuid = ref(new Map<R["uuid"], R>());
  const filter = ref<(record: R) => boolean>();
  const sort = ref<(record1: R, record2: R) => 1 | 0 | -1>();
  const xenApiStore = useXenApiStore();

  const setFilter = (newFilter: (record: R) => boolean) =>
    (filter.value = newFilter);

  const setSort = (newSort: (record1: R, record2: R) => 1 | 0 | -1) =>
    (sort.value = newSort);

  const records = computed<R[]>(() => {
    const records = Array.from(recordsByOpaqueRef.value.values()).sort(
      sort.value
    );
    return filter.value !== undefined ? records.filter(filter.value) : records;
  });

  const getByOpaqueRef = (opaqueRef: R["$ref"]) =>
    recordsByOpaqueRef.value.get(opaqueRef);

  const getByUuid = (uuid: R["uuid"]) => recordsByUuid.value.get(uuid);

  const hasUuid = (uuid: R["uuid"]) => recordsByUuid.value.has(uuid);

  const hasSubscriptions = computed(() => subscriptions.value.size > 0);

  const fetchAll = async () => {
    try {
      isFetching.value = true;
      lastError.value = undefined;
      const records = await xenApiStore.getXapi().loadRecords<T, R>(type);
      recordsByOpaqueRef.value.clear();
      recordsByUuid.value.clear();
      records.forEach(add);
      isReady.value = true;
    } catch (e) {
      lastError.value = `[${type}] Failed to fetch records`;
    } finally {
      isFetching.value = false;
    }
  };

  const add = (record: R) => {
    recordsByOpaqueRef.value.set(record.$ref, record);
    recordsByUuid.value.set(record.uuid, record);
  };

  const update = (record: R) => {
    recordsByOpaqueRef.value.set(record.$ref, record);
    recordsByUuid.value.set(record.uuid, record);
  };

  const remove = (opaqueRef: R["$ref"]) => {
    if (!recordsByOpaqueRef.value.has(opaqueRef)) {
      return;
    }

    const record = recordsByOpaqueRef.value.get(opaqueRef)!;
    recordsByOpaqueRef.value.delete(opaqueRef);
    recordsByUuid.value.delete(record.uuid);
  };

  whenever(
    () => xenApiStore.isConnected && hasSubscriptions.value,
    () => fetchAll()
  );

  function subscribe<O extends SubscribeOptions<any>>(
    options?: O
  ): Subscription<T, O> {
    const id = Symbol();

    tryOnUnmounted(() => {
      unsubscribe(id);
    });

    const subscription = {
      records,
      getByOpaqueRef,
      getByUuid,
      hasUuid,
      isReady: readonly(isReady),
      isFetching: readonly(isFetching),
      isReloading: isReloading,
      hasError,
      lastError: readonly(lastError),
    };

    const start = () => subscriptions.value.add(id);

    if (options?.immediate !== false) {
      start();
      return subscription as unknown as Subscription<T, O>;
    }

    return {
      ...subscription,
      start,
      isStarted: computed(() => subscriptions.value.has(id)),
    } as unknown as Subscription<T, O>;
  }

  const unsubscribe = (id: symbol) => subscriptions.value.delete(id);

  return {
    hasSubscriptions,
    subscribe,
    unsubscribe,
    add,
    update,
    remove,
    setFilter,
    setSort,
  };
};
