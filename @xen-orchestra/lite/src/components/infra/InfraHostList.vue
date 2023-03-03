<template>
  <ul class="infra-host-list">
    <li v-if="!isReady">{{ $t("loading-hosts") }}</li>
    <template v-else>
      <InfraHostItem
        v-for="host in hosts"
        :key="host.$ref"
        :host-opaque-ref="host.$ref"
      />
    </template>
  </ul>
</template>

<script lang="ts" setup>
import InfraHostItem from "@/components/infra/InfraHostItem.vue";
import { useHostStore } from "@/stores/host.store";

const { records: hosts, isReady } = useHostStore().subscribe();
</script>
