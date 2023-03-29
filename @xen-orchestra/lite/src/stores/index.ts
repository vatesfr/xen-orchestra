import { computed, ref } from "vue";
import type { ObjectType, RawObjectType, XenApiRecord } from "@/libs/xen-api";
import { useRecordsStore } from "@/stores/records.store";

type Options<T extends XenApiRecord> = {
  filter?: (record: T) => boolean;
  sort?: (record1: T, record2: T) => 1 | 0 | -1;
};

export function createRecordContext<T extends XenApiRecord>(
  objectType: RawObjectType,
  options: Options<T> = {}
) {
  let isInitialized = false;
  const isLoading = ref(true);
  const hasError = ref(false);

  async function init() {
    if (isInitialized) {
      return;
    }

    isInitialized = true;

    const xapiRecordsStore = useRecordsStore();
    try {
      await xapiRecordsStore.loadRecords(objectType);
    } catch (error) {
      hasError.value = true;
      console.error("stores#createRecordContext", error);
    } finally {
      isLoading.value = false;
    }
  }

  const opaqueRefs = computed<string[]>(() => {
    const xapiRecordsStore = useRecordsStore();
    let opaqueRefs: string[] = Array.from(
      xapiRecordsStore.getRecordsOpaqueRefs(
        objectType.toLocaleLowerCase() as ObjectType
      )
    );

    if (options.filter) {
      opaqueRefs = opaqueRefs.filter((opaqueRef) =>
        options.filter!(xapiRecordsStore.getRecord(opaqueRef))
      );
    }

    if (options.sort) {
      opaqueRefs = opaqueRefs.sort((opaqueRef1, opaqueRef2) => {
        return options.sort!(
          xapiRecordsStore.getRecord(opaqueRef1),
          xapiRecordsStore.getRecord(opaqueRef2)
        );
      });
    }

    return opaqueRefs;
  });

  const allRecords = computed(() =>
    opaqueRefs.value.map((opaqueRef) => getRecord(opaqueRef))
  );

  const getRecord = (opaqueRef: string) =>
    useRecordsStore().getRecord<T>(opaqueRef);

  const getRecordByUuid = (uuid: string) =>
    useRecordsStore().getRecordByUuid<T>(uuid);

  const hasRecordByUuid = (uuid: string) =>
    useRecordsStore().hasRecordByUuid(uuid);

  return {
    init,
    opaqueRefs,
    getRecord,
    getRecordByUuid,
    isLoading,
    isReady: computed(() => !isLoading.value && !hasError.value),
    hasError,
    allRecords,
    hasRecordByUuid,
  };
}
