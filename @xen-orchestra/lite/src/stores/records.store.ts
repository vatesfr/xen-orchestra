import { defineStore } from "pinia";
import { reactive, shallowReactive } from "vue";
import { buildXoObject } from "@/libs/utils";
import type { ObjectType, RawObjectType, XenApiRecord } from "@/libs/xen-api";
import { useXenApiStore } from "@/stores/xen-api.store";

export const useRecordsStore = defineStore("records", () => {
  const recordsByOpaqueRef = shallowReactive<Map<string, XenApiRecord>>(
    new Map()
  );
  const opaqueRefsByObjectType = reactive<Map<ObjectType, Set<string>>>(
    new Map()
  );
  const uuidToOpaqueRefMapping = reactive<Map<string, string>>(new Map());

  async function loadRecords<T extends XenApiRecord>(
    objectType: RawObjectType
  ) {
    const xenApiStore = useXenApiStore();
    const xapi = await xenApiStore.getXapi();
    const loadedRecords = await xapi.loadRecords<T>(objectType);

    const lowercaseObjectType = objectType.toLocaleLowerCase() as ObjectType;

    if (!opaqueRefsByObjectType.has(lowercaseObjectType)) {
      opaqueRefsByObjectType.set(lowercaseObjectType, new Set());
    }

    const opaqueRefs = opaqueRefsByObjectType.get(lowercaseObjectType);
    for (const [opaqueRef, record] of loadedRecords) {
      recordsByOpaqueRef.set(opaqueRef, record);
      opaqueRefs?.add(opaqueRef);
      uuidToOpaqueRefMapping.set(record.uuid, opaqueRef);
    }
  }

  function addOrReplaceRecord<T extends XenApiRecord>(
    objectType: ObjectType,
    opaqueRef: string,
    record: T
  ) {
    recordsByOpaqueRef.set(opaqueRef, buildXoObject(record, { opaqueRef }));
    opaqueRefsByObjectType.get(objectType)?.add(opaqueRef);
    uuidToOpaqueRefMapping.set(record.uuid, opaqueRef);
  }

  function removeRecord(objectType: ObjectType, opaqueRef: string) {
    recordsByOpaqueRef.delete(opaqueRef);
    opaqueRefsByObjectType.get(objectType)?.delete(opaqueRef);

    for (const [currentUuid, currentOpaqueRef] of uuidToOpaqueRefMapping) {
      if (currentOpaqueRef === opaqueRef) {
        uuidToOpaqueRefMapping.delete(currentUuid);
        return;
      }
    }
  }

  function getRecord<T extends XenApiRecord>(opaqueRef: string): T {
    if (!recordsByOpaqueRef.has(opaqueRef)) {
      throw new Error(`No record with ref ${opaqueRef}`);
    }
    return recordsByOpaqueRef.get(opaqueRef) as T;
  }

  function getRecordByUuid<T extends XenApiRecord>(
    uuid: string
  ): T | undefined {
    const opaqueRef = uuidToOpaqueRefMapping.get(uuid);

    if (opaqueRef) {
      return recordsByOpaqueRef.get(opaqueRef) as T;
    }
  }

  function getRecordsOpaqueRefs(objectType: ObjectType) {
    return opaqueRefsByObjectType.get(objectType) || new Set();
  }

  function hasRecordByUuid(uuid: string): boolean {
    return uuidToOpaqueRefMapping.has(uuid);
  }

  return {
    loadRecords,
    addOrReplaceRecord,
    removeRecord,
    getRecord,
    getRecordsOpaqueRefs,
    getRecordByUuid,
    hasRecordByUuid,
  };
});
