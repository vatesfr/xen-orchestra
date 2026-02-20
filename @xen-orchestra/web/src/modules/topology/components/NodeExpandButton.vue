<template>
  <div class="expand-anchor">
    <Handle type="source" :position="Position.Bottom" class="hidden-handle" />
    <button type="button" class="expand-btn" :class="{ expanded }" @click.stop="$emit('toggle')">
      <FontAwesomeIcon :icon="expanded ? faChevronUp : faChevronDown" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Handle, Position } from '@vue-flow/core'

defineProps<{ expanded: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<style lang="postcss" scoped>
.expand-anchor {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
  z-index: 1;
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
    color 0.15s ease;

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
