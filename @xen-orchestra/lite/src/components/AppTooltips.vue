<template>
  <AppTooltip
    v-for="tooltip in tooltips"
    :key="tooltip.target"
    :content="tooltip.content"
    :placement="tooltip.placement"
    :target="tooltip.target"
    :disabled="tooltip.disabled"
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
