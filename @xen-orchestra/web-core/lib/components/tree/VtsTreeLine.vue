<template>
  <div :class="className" class="vts-tree-line">
    <div class="tree-line-vertical" />
    <div :class="{ right }" class="tree-line-horizontal" />
  </div>
</template>

<script lang="ts" setup>
import type { TreeItemLabelSize } from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

const { size = 'medium' } = defineProps<{
  right?: boolean
  size?: TreeItemLabelSize
}>()

const className = computed(() => toVariants({ size }))
</script>

<style lang="postcss" scoped>
.vts-tree-line {
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: end;

  .tree-line-vertical {
    width: 0.1rem;
    background: var(--color-brand-txt-base);
  }

  .tree-line-horizontal {
    height: 0.1rem;
    width: 50%;
    background: transparent;

    &.right {
      background: var(--color-brand-txt-base);
    }
  }

  &.size--small {
    flex: 0 1 1.6rem;

    .tree-line-vertical {
      height: 100%;
    }
  }

  &.size--medium {
    flex: 0 1 2.4rem;

    .tree-line-vertical {
      height: calc(100% + 0.2rem);
    }
  }
}
</style>
