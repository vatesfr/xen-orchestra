<template>
  <div class="vts-tree-line" :class="{ 'tree-line-half-width': halfWidth }">
    <div :class="{ 'tree-line-half-height': halfHeight }" class="tree-line-vertical" />
    <div :class="{ right }" class="tree-line-horizontal" />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  halfHeight?: boolean
  right?: boolean
  halfWidth?: boolean
}>()
</script>

<style lang="postcss" scoped>
.vts-tree-line {
  flex: 0 0 1em;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: end;

  .tree-line-vertical {
    width: 0.1rem;
    background: var(--color-brand-txt-base);
    height: calc(100% + 0.7rem);
    transform: translateY(calc(0.7rem * -1));
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

.vts-tree-item:last-child {
  > .ui-tree-item-label {
    .tree-line-half-height {
      align-self: start;
      height: calc(50% + 0.7rem);
    }
    .tree-line-half-width {
      .tree-line-vertical {
        transform: translateY(calc(0.7rem * -1)) translateX(0.7rem);
      }
      .tree-line-horizontal {
        transform: translateX(0.7rem);
        width: calc(50% + 0.7rem);
      }
    }
  }
}
</style>
