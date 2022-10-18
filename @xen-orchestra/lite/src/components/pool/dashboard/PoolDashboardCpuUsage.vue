<template>
  <UiCard>
    <UiTitle type="h4">{{ $t("cpu-usage") }}</UiTitle>
    <HostsCpuUsage />
    <VmsCpuUsage />
  </UiCard>
</template>
<script lang="ts" setup>
import HostsCpuUsage from "@/components/pool/dashboard/cpuUsage/HostsCpuUsage.vue";
import VmsCpuUsage from "@/components/pool/dashboard/cpuUsage/VmsCpuUsage.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
</script>
