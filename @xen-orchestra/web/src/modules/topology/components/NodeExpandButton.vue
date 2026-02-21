<template>
  <div class="expand-anchor" :class="isLR ? 'anchor-lr' : 'anchor-tb'">
    <Handle type="source" :position="sourcePosition" class="hidden-handle" />
    <button type="button" class="expand-btn" :class="{ expanded }" :style="scaleStyle" @click.stop="$emit('toggle')">
      <FontAwesomeIcon :icon="expandIcon" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { TOPOLOGY_DIRECTION, TOPOLOGY_ZOOM } from '@/modules/topology/composables/use-topology-interaction.ts'
import { faChevronDown, faChevronLeft, faChevronRight, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Handle, Position } from '@vue-flow/core'
import type { CSSProperties } from 'vue'
import { computed, inject } from 'vue'

const { expanded } = defineProps<{ expanded: boolean }>()
defineEmits<{ toggle: [] }>()

const ZOOM_THRESHOLD = 0.6

const zoom = inject(TOPOLOGY_ZOOM)
const direction = inject(TOPOLOGY_DIRECTION, 'TB')

const isLR = direction === 'LR'

const sourcePosition = computed(() => (isLR ? Position.Right : Position.Bottom))

const expandIcon = computed(() => {
  if (isLR) {
    return expanded ? faChevronLeft : faChevronRight
  }
  return expanded ? faChevronUp : faChevronDown
})

const scaleStyle = computed<CSSProperties | undefined>(() => {
  const z = zoom?.value ?? 1
  if (z >= ZOOM_THRESHOLD) {
    return undefined
  }
  const scale = ZOOM_THRESHOLD / z
  return { transform: `scale(${scale})` }
})
</script>

<style scoped lang="postcss">
.expand-anchor {
  position: absolute;
  z-index: 1;

  &.anchor-tb {
    bottom: 0;
    left: 50%;
    transform: translate(-50%, 50%);
  }

  &.anchor-lr {
    right: 0;
    top: 50%;
    transform: translate(50%, -50%);
  }
}

.hidden-handle {
  opacity: 0;
  pointer-events: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.expand-btn {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  border: 0.2rem solid var(--color-neutral-border);
  background: var(--color-neutral-background-primary);
  color: var(--color-neutral-txt-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;

  &:hover {
    border-color: var(--color-brand-item-base);
    color: var(--color-brand-item-base);
    background: var(--color-brand-background-hover);
  }

  &.expanded {
    border-color: var(--color-brand-item-base);
    color: var(--color-brand-item-base);
  }
}
</style>
