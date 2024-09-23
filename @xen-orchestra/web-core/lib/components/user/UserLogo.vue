<!-- v1.0 -->
<template>
  <span :class="size" class="user-logo" />
</template>

<script lang="ts" setup>
import type { UserLogoSize } from '@core/types/size.type'

withDefaults(
  defineProps<{
    size?: UserLogoSize
  }>(),
  { size: 'extra-small' }
)
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.user-logo {
  --border-color: var(--color-normal-txt-base);
}

/* SIZE VARIANTS */
.user-logo {
  &.extra-small {
    --size: 1.6rem;
    --border-size: 0.1rem;
    --background-position: -0.8rem -0.493rem;
    --background-size: 2.88rem;
  }

  &.small {
    --size: 2.4rem;
    --border-size: 0.1rem;
    --background-position: -1.2rem -0.739rem;
    --background-size: 4.32rem;
  }

  &.medium {
    --size: 4rem;
    --border-size: 0.2rem;
    --background-position: -2rem -1.232rem;
    --background-size: 7.2rem;
  }
}

/* IMPLEMENTATION */
.user-logo {
  display: block;
  width: var(--size);
  height: var(--size);
  background: var(--color-neutral-txt-primary) url('../../assets/user.png') no-repeat var(--background-position) /
    var(--background-size);
  border: var(--border-size) solid var(--border-color);
  border-radius: 20rem;
}
</style>
