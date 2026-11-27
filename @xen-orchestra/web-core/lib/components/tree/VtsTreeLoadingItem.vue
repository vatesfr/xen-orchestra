<template>
  <li :class="className" class="vts-tree-loading-item">
    <div class="label-placeholder">
      <div class="link-placeholder">
        <template v-if="depth > 1">
          <VtsTreeLine v-for="i in depth - 1" :key="i" :right="i === depth - 1" :size="resolvedSize" />
        </template>
        <VtsIcon :name="icon" size="medium" />
        <div class="loader">&nbsp;</div>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTreeLine from '@core/components/tree/VtsTreeLine.vue'
import type { TreeItemLabelSize } from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import type { IconName } from '@core/icons'
import { TREE_ITEM_SMALL_HEIGHT } from '@core/packages/tree/types.ts'
import { IK_TREE_ITEM_LABEL_SIZE, IK_TREE_LIST_DEPTH } from '@core/utils/injection-keys.util.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed, inject, ref } from 'vue'

const { size } = defineProps<{
  icon: IconName
  size?: TreeItemLabelSize
}>()

const depth = inject(IK_TREE_LIST_DEPTH, ref(0))

const contextSize = inject(IK_TREE_ITEM_LABEL_SIZE, undefined)

const resolvedSize = computed(() => size ?? contextSize ?? 'medium')

const className = computed(() => toVariants({ size: resolvedSize.value }))

const smallHeight = `${TREE_ITEM_SMALL_HEIGHT}px`
</script>

<style lang="postcss" scoped>
.vts-tree-loading-item {
  .label-placeholder {
    display: flex;
    background-color: var(--color-neutral-background-primary);

    .link-placeholder {
      display: flex;
      align-items: center;
      flex: 1;
      padding: 0 0.8rem;
      gap: 0.4rem;
    }

    .loader {
      flex: 1;
      animation: pulse alternate 1s infinite;
      background-color: var(--color-brand-background-selected);
    }
  }

  &.size--small .label-placeholder {
    height: v-bind(smallHeight);
  }

  &.size--medium .label-placeholder {
    height: 4rem;
  }

  @keyframes pulse {
    0% {
      opacity: 0.5;
    }

    100% {
      opacity: 1;
    }
  }
}
</style>
