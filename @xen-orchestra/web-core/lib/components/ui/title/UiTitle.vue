<!-- v5 -->
<template>
  <div class="ui-title" :class="toVariants({ variant })">
    <div class="label" :class="[titleVariant, toVariants({ size, variant })]">
      <slot />
    </div>
    <div v-if="slots.action && size" class="action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

const { size, variant } = defineProps<{
  size?: 'small' | 'large'
  variant?: 'small' | 'medium'
}>()

const slots = defineSlots<{
  default(): any
  action?(): any
}>()

const titleVariant = computed(() => {
  if (variant === 'small') {
    return 'typo-body-bold-small'
  }

  if (variant === 'medium') {
    return 'typo-h6'
  }

  return size === 'small' ? 'typo-h6' : 'typo-h4'
})
</script>

<style scoped lang="postcss">
.ui-title {
  display: flex;
  align-items: center;
  gap: 2.4rem;
  padding-block-end: 0.4rem;
  border-bottom: 0.1rem solid var(--color-brand-txt-base);

  .label {
    color: var(--color-brand-txt-base);

    /** VARIANT **/

    &.variant--small,
    &.variant--medium {
      color: var(--color-neutral-txt-primary);
    }
  }

  .action {
    margin-inline-start: auto;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  /** VARIANT **/

  &.variant--small,
  &.variant--medium {
    border-bottom: none;
  }
}
</style>
