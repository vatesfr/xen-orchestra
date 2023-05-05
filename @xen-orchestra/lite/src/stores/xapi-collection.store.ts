import type { RawObjectType, XenApiRecord } from "@/libs/xen-api";
import { useXenApiStore } from "@/stores/xen-api.store";
import type {
  CollectionSubscription,
  DeferredCollectionSubscription,
  RawTypeToObject,
  SubscribeOptions,
} from "@/types/xapi-collection";
import { tryOnUnmounted, whenever } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, readonly, ref } from "vue";

export const useXapiCollectionStore = defineStore("xapiCollection", () => {
  const collections = ref(
    new Map<RawObjectType, ReturnType<typeof createXapiCollection<any>>>()
  );

  function get<
    T extends RawObjectType,
    S extends XenApiRecord = RawTypeToObject[T]
  >(type: T): ReturnType<typeof createXapiCollection<S>> {
    if (!collections.value.has(type)) {
      collections.value.set(type, createXapiCollection<S>(type));
    }

    return collections.value.get(type)!;
  }

  return { get };
});

const createXapiCollection = <T extends XenApiRecord>(type: RawObjectType) => {
  const isReady = ref(false);
  const isFetching = ref(false);
  const isReloading = computed(() => isReady.value && isFetching.value);
  const lastError = ref<string>();
  const hasError = computed(() => lastError.value !== undefined);
  const subscriptions = ref(new Set<symbol>());
  const recordsByOpaqueRef = ref(new Map<string, T>());
  const recordsByUuid = ref(new Map<string, T>());
  const filter = ref<(record: T) => boolean>();
  const sort = ref<(record1: T, record2: T) => 1 | 0 | -1>();
  const xenApiStore = useXenApiStore();

  const setFilter = (newFilter: (record: T) => boolean) =>
    (filter.value = newFilter);

  const setSort = (newSort: (record1: T, record2: T) => 1 | 0 | -1) =>
    (sort.value = newSort);

  const records = computed<T[]>(() => {
    const records = Array.from(recordsByOpaqueRef.value.values()).sort(
      sort.value
    );
    return filter.value !== undefined ? records.filter(filter.value) : records;
  });

  const getByOpaqueRef = (opaqueRef: string) =>
    recordsByOpaqueRef.value.get(opaqueRef);

  const getByUuid = (uuid: string) => recordsByUuid.value.get(uuid);

  const hasUuid = (uuid: string) => recordsByUuid.value.has(uuid);

  const hasSubscriptions = computed(() => subscriptions.value.size > 0);

  const fetchAll = async () => {
    try {
      isFetching.value = true;
      lastError.value = undefined;
      const records = await xenApiStore.getXapi().loadRecords<T>(type);
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

  const add = (record: T) => {
    recordsByOpaqueRef.value.set(record.$ref, record);
    recordsByUuid.value.set(record.uuid, record);
  };

  const update = (record: T) => {
    recordsByOpaqueRef.value.set(record.$ref, record);
    recordsByUuid.value.set(record.uuid, record);
  };

  const remove = (opaqueRef: string) => {
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

  function subscribe(
    options?: SubscribeOptions<true>
  ): CollectionSubscription<T>;

  function subscribe(
    options: SubscribeOptions<false>
  ): DeferredCollectionSubscription<T>;

  function subscribe(
    options: SubscribeOptions<boolean>
  ): CollectionSubscription<T> | DeferredCollectionSubscription<T>;

  function subscribe({ immediate = true }: SubscribeOptions<boolean> = {}) {
    const id = Symbol();

    if (immediate) {
      subscriptions.value.add(id);
    }

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

    if (immediate) {
      return subscription;
    }

    return {
      ...subscription,
      start: () => subscriptions.value.add(id),
      isStarted: computed(() => subscriptions.value.has(id)),
    };
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
