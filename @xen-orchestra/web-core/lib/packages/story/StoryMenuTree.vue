<template>
  <ul class="story-menu-tree">
    <li v-for="[key, node] in tree" :key="key">
      <span
        v-if="node.children.size > 0"
        class="directory typo-body-bold"
        @click="emit('toggleDirectory', node.directory)"
      >
        <VtsIcon accent="brand" :icon="isOpen(node.directory) ? faFolderOpen : faFolderClosed" />
        {{ formatName(key) }}
      </span>
      <RouterLink v-else :to="node.path" class="link typo-body-regular">
        <VtsIcon accent="brand" :icon="faFile" />
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
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { StoryTree } from '@core/packages/story/StoryMenu.vue'
import { faFile, faFolderClosed, faFolderOpen } from '@fortawesome/free-regular-svg-icons'

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
