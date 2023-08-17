import type { RawObjectType, XenApiRecord } from "@/libs/xen-api";
import { useXenApiStore } from "@/stores/xen-api.store";
import type { RawTypeToRecord } from "@/types/xen-api-collection";
import { whenever } from "@vueuse/core";
import { computed, reactive } from "vue";

const collections = new Map<RawObjectType, XenApiCollection<any>>();

export const getXenApiCollection = <
  ObjectType extends RawObjectType,
  Record extends RawTypeToRecord<ObjectType> = RawTypeToRecord<ObjectType>,
>(
  type: ObjectType
) => {
  if (!collections.has(type)) {
    collections.set(type, new XenApiCollection(type));
  }

  return collections.get(type)! as XenApiCollection<Record>;
};

export class XenApiCollection<Record extends XenApiRecord<any>> {
  private state = reactive({
    isReady: false,
    isFetching: false,
    lastError: undefined as string | undefined,
    subscriptions: new Set<symbol>(),
    recordsByOpaqueRef: new Map<Record["$ref"], Record>(),
    recordsByUuid: new Map<Record["uuid"], Record>(),
  });

  isReady = computed(() => this.state.isReady);

  isFetching = computed(() => this.state.isFetching);

  isReloading = computed(() => this.state.isReady && this.state.isFetching);

  lastError = computed(() => this.state.lastError);

  hasError = computed(() => this.state.lastError !== undefined);

  hasSubscriptions = computed(() => this.state.subscriptions.size > 0);

  records = computed(() => Array.from(this.state.recordsByOpaqueRef.values()));

  subscribe(id: symbol) {
    this.state.subscriptions.add(id);
  }

  unsubscribe(id: symbol) {
    this.state.subscriptions.delete(id);
  }

  constructor(private type: RawObjectType) {
    const xenApiStore = useXenApiStore();

    whenever(
      () => xenApiStore.isConnected && this.hasSubscriptions.value,
      () => this.fetchAll(xenApiStore)
    );
  }

  getByOpaqueRef(opaqueRef: Record["$ref"]) {
    return this.state.recordsByOpaqueRef.get(opaqueRef);
  }

  getByUuid(uuid: Record["uuid"]) {
    return this.state.recordsByUuid.get(uuid);
  }

  hasUuid(uuid: Record["uuid"]) {
    return this.state.recordsByUuid.has(uuid);
  }

  add(record: Record) {
    this.state.recordsByOpaqueRef.set(record.$ref, record);
    this.state.recordsByUuid.set(record.uuid, record);
  }

  update(record: Record) {
    this.state.recordsByOpaqueRef.set(record.$ref, record);
    this.state.recordsByUuid.set(record.uuid, record);
  }

  remove(opaqueRef: Record["$ref"]) {
    if (!this.state.recordsByOpaqueRef.has(opaqueRef)) {
      return;
    }

    const record = this.state.recordsByOpaqueRef.get(opaqueRef)!;
    this.state.recordsByOpaqueRef.delete(opaqueRef);
    this.state.recordsByUuid.delete(record.uuid);
  }

  private async fetchAll(xenApiStore: ReturnType<typeof useXenApiStore>) {
    try {
      this.state.isFetching = true;
      this.state.lastError = undefined;
      const records = await xenApiStore
        .getXapi()
        .loadRecords<any, Record>(this.type);
      this.state.recordsByOpaqueRef.clear();
      this.state.recordsByUuid.clear();
      records.forEach((record) => this.add(record));
      this.state.isReady = true;
    } catch {
      this.state.lastError = `[${this.type}] Failed to fetch records`;
    } finally {
      this.state.isFetching = false;
    }
  }
}
