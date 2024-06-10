<template>
  <RouterLink :to="{ name: 'story' }">
    <UiTitle type="h4">Stories</UiTitle>
  </RouterLink>
  <StoryMenuTree :tree :opened-directories="openedDirectories" @toggle-directory="toggleDirectory" />
</template>

<script lang="ts" setup>
import StoryMenuTree from '@/components/component-story/StoryMenuTree.vue'
import UiTitle from '@/components/ui/UiTitle.vue'
import { ref } from 'vue'
import { type RouteRecordNormalized, useRoute, useRouter } from 'vue-router'

const { getRoutes } = useRouter()

const routes = getRoutes().filter(route => route.meta.isStory)

export type StoryTree = Map<string, { path: string; directory: string; children: StoryTree }>

function createTree(routes: RouteRecordNormalized[]) {
  const tree: StoryTree = new Map()

  for (const route of routes) {
    const parts = route.path.slice(7).split('/')
    let currentNode = tree
    let currentPath = ''

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      if (!currentNode.has(part)) {
        currentNode.set(part, {
          children: new Map(),
          path: route.path,
          directory: currentPath,
        })
      }
      currentNode = currentNode.get(part)!.children
    }
  }

  return tree
}

const tree = createTree(routes)

const currentRoute = useRoute()

const getDefaultOpenedDirectories = (): Set<string> => {
  if (!currentRoute.meta.isStory) {
    return new Set<string>()
  }

  const openedDirectories = new Set<string>()
  const parts = currentRoute.path.split('/').slice(2)
  let currentPath = ''

  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part
    openedDirectories.add(currentPath)
  }

  return openedDirectories
}

const openedDirectories = ref(getDefaultOpenedDirectories())

const toggleDirectory = (directory: string) => {
  if (openedDirectories.value.has(directory)) {
    openedDirectories.value.delete(directory)
  } else {
    openedDirectories.value.add(directory)
  }
}
</script>
