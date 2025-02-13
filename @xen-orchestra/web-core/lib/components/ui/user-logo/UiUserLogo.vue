<!-- v2 -->
<template>
  <span :class="toVariants({ size })" class="ui-user-logo" />
</template>

<script lang="ts" setup>
import { toVariants } from '@core/utils/to-variants.util'

export type UserLogoSize = 'extra-small' | 'small' | 'medium'

defineProps<{
  size: UserLogoSize
}>()
</script>

<style lang="postcss" scoped>
.ui-user-logo {
  display: block;
  background: var(--color-neutral-txt-primary) url('../../../assets/user.png') no-repeat;
  border-style: solid;
  border-color: var(--color-brand-item-base);
  border-radius: 20rem;

  /* SIZE VARIANTS */

  &.size--extra-small {
    width: 1.6rem;
    height: 1.6rem;
    border-width: 0.1rem;
    background-position: -0.85rem -0.55rem;
    background-size: 2.88rem;
  }

  &.size--small {
    width: 2.4rem;
    height: 2.4rem;
    border-width: 0.1rem;
    background-position: -1.3rem -0.8rem;
    background-size: 4.32rem;
  }

  &.size--medium {
    width: 4rem;
    height: 4rem;
    border-width: 0.2rem;
    background-position: -2.2rem -1.4rem;
    background-size: 7.2rem;
  }
}
</style>
