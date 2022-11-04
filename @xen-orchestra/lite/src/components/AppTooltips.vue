<template>
  <AppTooltip
    v-for="tooltip in tooltips"
    :key="tooltip.key"
    :options="tooltip.options"
    :target="tooltip.target"
  />
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import AppTooltip from "@/components/AppTooltip.vue";
import { useTooltipStore } from "@/stores/tooltip.store";

const tooltipStore = useTooltipStore();
const { tooltips } = storeToRefs(tooltipStore);
</script>

<style scoped></style>
