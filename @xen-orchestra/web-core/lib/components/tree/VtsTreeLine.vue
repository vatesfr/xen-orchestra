<template>
  <div class="vts-tree-line">
    <div class="tree-line-vertical" />
    <div :class="{ right }" class="tree-line-horizontal" />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  halfHeight?: boolean
  right?: boolean
}>()
</script>

<style lang="postcss" scoped>
.vts-tree-line {
  flex: 0 1 1.5em;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: end;

  .tree-line-vertical {
    width: 0.1rem;
    background: var(--color-brand-txt-base);
    height: calc(100% + 0.2rem);
  }

  .tree-line-horizontal {
    height: 0.1rem;
    width: 50%;
    background: transparent;

    &.right {
      background: var(--color-brand-txt-base);
    }
  }
}
</style>
