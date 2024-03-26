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
  --border-color: var(--color-purple-base);
}

/* SIZE VARIANTS */
.user-logo {
  &.extra-small {
    --size: 1.6rem;
    --border-size: 0.1rem;
    --background-position: top -0.493rem left -0.8rem / 2.88rem;
  }

  &.small {
    --size: 2.4rem;
    --border-size: 0.1rem;
    --background-position: top -0.739rem left -1.2rem / 4.32rem;
  }

  &.medium {
    --size: 4rem;
    --border-size: 0.2rem;
    --background-position: top -1.232rem left -2rem / 7.2rem;
  }
}

/* IMPLEMENTATION */
.user-logo {
  display: block;
  width: var(--size);
  height: var(--size);
  background: var(--color-grey-100) url('../assets/user.png') no-repeat var(--background-position);
  border: var(--border-size) solid var(--border-color);
  border-radius: 20rem;
}
</style>
