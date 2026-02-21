<template>
  <BaseEdge :path="edgePath" :style="edgeStyle" />
</template>

<script lang="ts" setup>
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@vue-flow/core'
import { computed } from 'vue'

const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = defineProps<EdgeProps>()

const edgePath = computed(
  () =>
    getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      borderRadius: 8,
    })[0]
)

const edgeStyle = {
  stroke: 'var(--color-neutral-border)',
  strokeWidth: 1.5,
  strokeDasharray: '6 3',
  animation: 'edge-flow 1.5s linear infinite',
}
</script>
