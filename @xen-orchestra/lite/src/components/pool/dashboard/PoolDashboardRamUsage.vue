<template>
  <UiCard>
    <UiCardTitle>{{ $t("ram-usage") }}</UiCardTitle>
    <HostsRamUsage />
    <VmsRamUsage />
  </UiCard>
</template>

<script setup lang="ts">
import HostsRamUsage from "@/components/pool/dashboard/ramUsage/HostsRamUsage.vue";
import VmsRamUsage from "@/components/pool/dashboard/ramUsage/VmsRamUsage.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
</script>
