<template>
  <ul :class="{ root }">
    <li v-for="item of items" :key="item.id">
      <template v-if="item.properties.hasChildren">
        <div class="label typo-body-bold" @click="item.toggleFlag('expanded')">
          <VtsIcon :icon="item.flags.expanded ? faFolderOpen : faFolderClosed" accent="brand" fixed-width />
          {{ item.source.label }}
        </div>
        <StoryTree v-if="item.flags.expanded" :nodes="item.source.children" class="sub-tree" />
      </template>
      <RouterLink v-else :to="item.source.path" class="label link typo-body-regular">
        <VtsIcon :icon="faFile" accent="current" fixed-width />
        {{ item.source.label }}
      </RouterLink>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useCollection } from '@core/packages/collection'
import type { StoryRouteTreeNode } from '@core/packages/story/build-route-hierarchy.ts'
import { faFile, faFolderClosed, faFolderOpen } from '@fortawesome/free-regular-svg-icons'
import { computed } from 'vue'

const { nodes } = defineProps<{
  nodes: StoryRouteTreeNode[]
  root?: boolean
}>()

const { items } = useCollection(() => nodes, {
  itemId: node => node.label,
  flags: ['expanded'],
  properties: node => ({
    hasChildren: computed(() => node.children.length > 0),
  }),
})
</script>

<style lang="postcss" scoped>
.root {
  padding: 0.5rem 1rem;
}

.label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.4rem 0;
  gap: 0.5rem;
  text-decoration: none;
}

.sub-tree {
  margin-left: 2rem;
}
</style>
