<template>
    <li v-if="sr !== undefined" class="infra-sr-item">
      <InfraItemLabel
        :icon="faHdd"
        :route="{ name: 'sr.dashboard', params: { uuid: sr.uuid } }"
      >
        {{ sr.name_label || "(SR)" }}
        <template #actions>
          <InfraAction
            v-if="isShared"
            v-tooltip="'Shared'"
            :icon="faSquareShareNodes"
            class="shared-icon"
          />
        </template>
      </InfraItemLabel>
    </li>
  </template>
  
  <script lang="ts" setup>
  import InfraAction from "@/components/infra/InfraAction.vue";
  import InfraItemLabel from "@/components/infra/InfraItemLabel.vue";
  import { useSrCollection } from "@/stores/xen-api/sr.store";
  import { vTooltip } from "@/directives/tooltip.directive";
  import type { XenApiSr } from "@/libs/xen-api/xen-api.types";
  import {
    faHdd,faSquareShareNodes
  } from "@fortawesome/free-solid-svg-icons";
  import { computed } from "vue";
  
  
  const props = defineProps<{
    srOpaqueRef: XenApiSr["$ref"];
  }>();
  
  const { getByOpaqueRef } = useSrCollection();
  const sr = computed(() => getByOpaqueRef(props.srOpaqueRef));
  
  const isShared = computed(() => sr.value?.shared == true);
  
  </script>
  
  <style lang="postcss" scoped>
  .infra-sr-item:deep(.link),
  .infra-sr-item:deep(.link-placeholder) {
    padding-left: 2rem;
  }

  .shared-icon {
    color: var(--color-orange-world-base);
  }
  </style>