<template>
  <div :class="{ wide }" class="backup-job-form-row">
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  wide?: boolean
}>()

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.backup-job-form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2.4rem;

  & > * {
    width: auto;
  }

  &.wide {
    grid-template-columns: 1fr;
  }
}
</style>
