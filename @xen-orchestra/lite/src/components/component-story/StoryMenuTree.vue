<template>
  <ul class="story-menu-tree">
    <li v-for="[key, node] in tree" :key="key">
      <span
        v-if="node.children.size > 0"
        class="directory typo-body-bold"
        @click="emit('toggleDirectory', node.directory)"
      >
        <VtsIcon :name="isOpen(node.directory) ? 'fa:folder-open' : 'fa:folder-closed'" size="medium" />
        {{ formatName(key) }}
      </span>
      <RouterLink v-else :to="node.path" class="link typo-body-regular">
        <VtsIcon name="fa:file" size="medium" />
        {{ formatName(key) }}
      </RouterLink>

      <StoryMenuTree
        v-if="isOpen(node.directory)"
        :tree="node.children"
        :opened-directories="openedDirectories"
        @toggle-directory="emit('toggleDirectory', $event)"
      />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import type { StoryTree } from '@/components/component-story/StoryMenu.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'

const props = defineProps<{
  tree: StoryTree
  openedDirectories: Set<string>
}>()

const emit = defineEmits<{
  toggleDirectory: [directory: string]
}>()

const isOpen = (directory: string) => props.openedDirectories.has(directory)

const formatName = (name: string) => {
  const parts = name.split('-')
  return parts.map(part => part[0].toUpperCase() + part.slice(1)).join(' ')
}
</script>

<style lang="postcss" scoped>
.story-menu-tree {
  padding-left: 1rem;

  .story-menu-tree {
    padding-left: 2.2rem;
  }
}

.link {
  padding: 0.5rem 0;
}

.directory {
  padding: 0.5rem 0;
}

.link,
.directory {
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}
</style>
