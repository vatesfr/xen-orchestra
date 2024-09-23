<!-- v1.1 -->
<template>
  <li class="tree-loading-item">
    <div class="tree-loading-item-label-placeholder">
      <div class="link-placeholder">
        <template v-if="depth > 1">
          <TreeLine v-for="i in depth - 1" :key="i" :right="i === depth - 1" full-height />
        </template>
        <UiIcon :icon color="current" />
        <div class="loader">&nbsp;</div>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import TreeLine from '@core/components/tree/TreeLine.vue'
import { IK_TREE_LIST_DEPTH } from '@core/utils/injection-keys.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { inject } from 'vue'

defineProps<{
  icon: IconDefinition
}>()

const depth = inject(IK_TREE_LIST_DEPTH, 0)
</script>

<style lang="postcss" scoped>
.tree-loading-item-label-placeholder {
  display: flex;
  height: 4rem;
  background-color: var(--color-neutral-background-primary);
}

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
  background-color: var(--color-normal-background-selected);
}

@keyframes pulse {
  0% {
    opacity: 0.5;
  }

  100% {
    opacity: 1;
  }
}
</style>
