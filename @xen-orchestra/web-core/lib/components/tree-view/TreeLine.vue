<template>
  <div class="tree-line">
    <div
      class="tree-line-vertical"
      :class="{ 'tree-line-half-height': halfHeight, 'tree-line-full-height': fullHeight }"
    />
    <div class="tree-line-horizontal" :class="{ right }" />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  halfHeight?: boolean
  fullHeight?: boolean
  right?: boolean
}>()
</script>

<style lang="postcss" scoped>
.tree-line {
  flex: 0 1 1.25em;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: end;

  .tree-line-vertical {
    width: 0.1rem;
    background: var(--color-purple-base);

    &.tree-line-full-height {
      height: calc(100% + 0.5rem);
      transform: translateY(-0.5rem);
    }
  }

  .tree-line-horizontal {
    height: 0.1rem;
    width: 50%;
    background: transparent;

    &.right {
      background: var(--color-purple-base);
    }
  }
}

.ui-tree-item:last-child {
  > .ui-tree-item-label {
    .tree-line-half-height {
      align-self: start;
      height: calc(50% + 0.5rem);
    }
  }
}
</style>
