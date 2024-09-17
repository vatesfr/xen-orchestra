<!-- v1.1 -->
<template>
  <FontAwesomeLayers :class="size" class="complex-icon">
    <slot />
  </FontAwesomeLayers>
</template>

<script lang="ts" setup>
import { FontAwesomeLayers } from '@fortawesome/vue-fontawesome'

withDefaults(
  defineProps<{
    size?: 'small' | 'medium' | 'large'
  }>(),
  { size: 'medium' }
)
</script>

<style lang="postcss" scoped>
/* SIZE VARIANTS */
.complex-icon {
  &.small {
    --font-size: 1.2rem;
  }

  &.medium {
    --font-size: 1.6rem;
  }

  &.large {
    --font-size: 2rem;
  }
}

/* IMPLEMENTATION */
.complex-icon {
  font-size: var(--font-size);

  :nth-child(2) {
    font-size: 0.5em;
    transform: translate(100%, 80%);

    :deep(path) {
      stroke: var(--color-neutral-background-primary);
      stroke-width: 100px;
      stroke-linejoin: round;
      paint-order: stroke;
    }
  }
}
</style>
