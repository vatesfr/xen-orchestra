<template>
  <BaseEdge :path="edgePath" :style="edgeStyle" />
</template>

<script lang="ts" setup>
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@vue-flow/core'
import { computed } from 'vue'

const props = defineProps<EdgeProps>()

const edgePath = computed(() =>
  getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 8,
  })[0]
)

const edgeStyle = {
  stroke: 'var(--color-neutral-border)',
  strokeWidth: 1.5,
  strokeDasharray: '6 3',
}
</script>
