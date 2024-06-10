<!-- v1.0 -->
<template>
  <AppTooltip v-for="tooltip in tooltips" :key="tooltip.key" :options="tooltip.options" :target="tooltip.target" />
</template>

<script lang="ts" setup>
import AppTooltip from '@core/components/tooltip/TooltipItem.vue'
import { useTooltipStore } from '@core/stores/tooltip.store'
import { storeToRefs } from 'pinia'

const tooltipStore = useTooltipStore()
const { tooltips } = storeToRefs(tooltipStore)
</script>
