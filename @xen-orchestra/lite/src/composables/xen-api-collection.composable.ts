import type { RawObjectType } from "@/libs/xen-api";
import { getXenApiCollection } from "@/libs/xen-api-collection";
import type {
  RawTypeToRecord,
  XenApiBaseCollection,
  XenApiCollectionManager,
} from "@/types/xen-api-collection";
import { tryOnUnmounted } from "@vueuse/core";
import { computed } from "vue";

export const useXenApiCollection = <
  ObjectType extends RawObjectType,
  Record extends RawTypeToRecord<ObjectType>,
  Immediate extends boolean,
>(
  type: ObjectType,
  options?: { immediate?: Immediate }
): XenApiBaseCollection<Record, Immediate> => {
  const baseCollection = getXenApiCollection(type);
  const isDeferred = options?.immediate === false;

  const id = Symbol();

  const collection = {
    records: baseCollection.records,
    isFetching: baseCollection.isFetching,
    isReloading: baseCollection.isReloading,
    isReady: baseCollection.isReady,
    hasError: baseCollection.hasError,
    hasUuid: baseCollection.hasUuid.bind(baseCollection),
    getByUuid: baseCollection.getByUuid.bind(baseCollection),
    getByOpaqueRef: baseCollection.getByOpaqueRef.bind(baseCollection),
  };

  tryOnUnmounted(() => baseCollection.unsubscribe(id));

  if (isDeferred) {
    return {
      ...collection,
      start: () => baseCollection.subscribe(id),
      isStarted: computed(() => baseCollection.hasSubscriptions.value),
    } as XenApiBaseCollection<Record, false>;
  }

  baseCollection.subscribe(id);
  return collection as XenApiBaseCollection<Record, Immediate>;
};

export const useXenApiCollectionManager = <
  ObjectType extends RawObjectType,
  Record extends RawTypeToRecord<ObjectType>,
>(
  type: ObjectType
): XenApiCollectionManager<Record> => {
  const collection = getXenApiCollection(type);

  return {
    hasSubscriptions: collection.hasSubscriptions,
    add: collection.add.bind(collection),
    remove: collection.remove.bind(collection),
    update: collection.update.bind(collection),
  };
};
