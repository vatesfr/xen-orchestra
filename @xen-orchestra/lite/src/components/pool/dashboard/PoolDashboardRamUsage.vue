<template>
  <UiCard>
    <UiTitle type="h4">RAM usage</UiTitle>
    <HostsRamUsage />
    <VmsRamUsage />
  </UiCard>
</template>

<script setup lang="ts">
import HostsRamUsage from "@/components/pool/dashboard/ramUsage/HostsRamUsage.vue";
import VmsRamUsage from "@/components/pool/dashboard/ramUsage/VmsRamUsage.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
</script>
