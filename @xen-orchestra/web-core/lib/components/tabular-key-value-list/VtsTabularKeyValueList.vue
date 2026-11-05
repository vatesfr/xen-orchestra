<template>
  <dl class="vts-tabular-key-value-list" :class="{ 'full-height': fullHeight }">
    <slot />
  </dl>
</template>

<script lang="ts" setup>
defineProps<{
  fullHeight?: boolean
}>()
</script>

<style lang="postcss" scoped>
.vts-tabular-key-value-list {
  container-type: inline-size;
  container-name: vts-tabular-key-value-list;
  display: grid;
  grid-template-columns: minmax(min-content, 20rem) 1fr;
  row-gap: 1.6rem;
  column-gap: 2.4rem;
  align-items: start;
  align-self: flex-start;
  width: 100%;

  &.full-height {
    height: 100%;
  }
}
</style>
