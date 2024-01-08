<template>
    <ul class="infra-sr-list">
      <li v-if="hasError" class="text-error">
        {{ $t("error-no-data") }}
      </li>
      <li v-else-if="!isReady">{{ $t("loading-srs") }}</li>
      <template v-else>
        <InfraSrItem
          v-for="sr in srs"
          :key="sr.$ref"
          :sr-opaque-ref="sr.$ref"
        />
      </template>
    </ul>
  </template>
  
  <script lang="ts" setup>
  import InfraSrItem from "@/components/infra/InfraSrItem.vue";
  import { useSrCollection } from "@/stores/xen-api/sr.store";
  
  const { records: srs, isReady, hasError } = useSrCollection();

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
  