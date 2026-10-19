<template>
  <span class="inline-parts">
    <slot />
  </span>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.inline-parts {
  /* The separator is decoration: its empty alternative text keeps screen readers from reading it */
  & > :slotted(:not(:first-child))::before {
    content: '•' / '';
    margin-inline: 0.8rem;
  }
}
</style>
