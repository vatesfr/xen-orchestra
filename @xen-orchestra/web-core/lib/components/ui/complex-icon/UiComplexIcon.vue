<!-- v2 -->
<template>
  <FontAwesomeLayers :class="toVariants({ size })" class="ui-complex-icon">
    <slot />
  </FontAwesomeLayers>
</template>

<script lang="ts" setup>
import { toVariants } from '@core/utils/to-variants.util'
import { FontAwesomeLayers } from '@fortawesome/vue-fontawesome'

defineProps<{
  size: 'small' | 'medium' | 'large'
}>()
</script>

<style lang="postcss" scoped>
.ui-complex-icon {
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

  /*SIZE VARIANTS*/

  &.size--small {
    font-size: 1.2rem;
  }

  &.size--medium {
    font-size: 1.6rem;
  }

  &.size--large {
    font-size: 2rem;
  }
}
</style>
