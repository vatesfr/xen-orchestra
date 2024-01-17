<template>
    <ul class="infra-sr-list">
      <li v-if="hasError" class="text-error">
        {{ $t("error-no-data") }}
      </li>
      <li v-else-if="!isReady">{{ $t("loading-srs") }}</li>
      <template v-else-if="currentNavigationTab == NAV_TAB.STORAGES">
        <InfraSrItem
          v-for="sr in sharedSrs"
          :key="sr.$ref"
          :sr-opaque-ref="sr.$ref"
        />
      </template>
    </ul>
  </template>
  
  <script lang="ts" setup>
  import InfraSrItem from "@/components/infra/InfraSrItem.vue";
  import { useSrCollection } from "@/stores/xen-api/sr.store";
  import { NAV_TAB, useNavigationStore } from "@/stores/navigation.store";
  import { storeToRefs } from "pinia";
  import { computed } from "vue";
  import type { XenApiHost, XenApiSr } from "@/libs/xen-api/xen-api.types";

  const props = defineProps<{
    hostOpaqueRef?: XenApiHost["$ref"];
  }>();

  const vms = computed(() =>
  recordsByHostRef.value.get(
    props.hostOpaqueRef ?? ("OpaqueRef:NULL" as XenApiSr["$ref"])
  )
  );

  const navigationStore = useNavigationStore();
  const { currentNavigationTab } = storeToRefs(navigationStore);
  
  const { records: srs, isReady, hasError, recordsByHostRef } = useSrCollection();

  const sharedSrs = computed(()=> {
    if ()
    const srUuidDeDuplicateArray: string[] = [];    
    
    return srs.value.filter((sr) => {
      if (!sr.shared) {
        return false;
      }

      //duplicate
      if (srUuidDeDuplicateArray.includes(sr.uuid)) {
        return false;  
      }
      
      srUuidDeDuplicateArray.push(sr.uuid);

      return true;
      })   
  });

  </script>
  
  <style lang="postcss" scoped>
  .text-error {
    padding-left: 3rem;
    font-weight: 700;
    font-size: 16px;
    line-height: 150%;
    color: var(--color-red-vates-base);
  }
  </style>
  