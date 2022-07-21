<template>
  <ul class="infra-host-list">
    <li v-if="!isReady">Chargement des hosts en cours...</li>
    <template v-else>
      <InfraHostItem
        v-for="opaqueRef in opaqueRefs"
        :key="opaqueRef"
        :host-opaque-ref="opaqueRef"
      />
    </template>
  </ul>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import InfraHostItem from "@/components/infra/InfraHostItem.vue";
import { useHostStore } from "@/stores/host.store";

const hostStore = useHostStore();
const { opaqueRefs, isReady } = storeToRefs(hostStore);
</script>
