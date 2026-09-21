<template>
  <nav v-if="hasStoryNav" class="story-navigation">
    <StoryMenu />
  </nav>
  <VtsLayoutSidebar v-else class="app-navigation">
    <template #subheader>
      <SidebarSearch v-model="filter" />
    </template>
    <VtsTreeList v-if="hasError">
      <VtsTreeItemError>{{ t('error-no-data') }}</VtsTreeItemError>
    </VtsTreeList>
    <VtsTreeList v-else-if="!isReady">
      <VtsTreeLoadingItem v-for="i in 5" :key="i" icon="object:pool" />
    </VtsTreeList>
    <VtsStateHero v-else-if="isSearching" class="loader" format="card" size="medium" type="busy" />
    <VtsStateHero v-else-if="treeItems.length === 0" format="card" size="medium" type="no-result">
      {{ t('no-result') }}
    </VtsStateHero>
    <PoolTreeList v-else ref="poolTreeList" :items="treeItems" />
  </VtsLayoutSidebar>
</template>

<script lang="ts" setup>
import StoryMenu from '@/components/component-story/StoryMenu.vue'
import { usePoolTree } from '@/modules/pool/composables/pool-tree.composable.ts'
import PoolTreeList from '@/modules/treeview/components/PoolTreeList.vue'
import SidebarSearch from '@/modules/treeview/components/SidebarSearch.vue'
import VtsLayoutSidebar from '@core/components/layout/VtsLayoutSidebar.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTreeItemError from '@core/components/tree/VtsTreeItemError.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

const { treeItems, treeItemIndexById, isReady, hasError, filter, isSearching, expandToNode } = usePoolTree()

const route = useRoute<'/pool/[uuid]' | '/host/[uuid]' | '/vm/[uuid]'>()

const hasStoryNav = computed(() => route.meta.hasStoryNav === true)

const poolTreeList = useTemplateRef('poolTreeList')

const currentNodeId = computed(() => {
  const uuid = Array.isArray(route.params.uuid) ? route.params.uuid[0] : route.params.uuid

  if (uuid === undefined) {
    return undefined
  }

  const prefix = (['pool', 'host', 'vm'] as const).find(type => route.path.startsWith(`/${type}/`))

  return prefix === undefined ? undefined : `${prefix}:${uuid}`
})

let scrolledToId: string | undefined

async function scrollToCurrentNode() {
  const nodeId = currentNodeId.value

  if (nodeId === undefined) {
    scrolledToId = undefined
    return
  }

  if (nodeId === scrolledToId) {
    return
  }

  const node = expandToNode(nodeId)

  if (node === undefined) {
    return
  }

  const index = treeItemIndexById.value.get(node.id)

  if (index === undefined) {
    return
  }

  scrolledToId = nodeId

  await nextTick()

  poolTreeList.value?.scrollToItem(index)
}

watch(
  [currentNodeId, isReady, treeItems],
  () => {
    if (isReady.value) {
      scrollToCurrentNode()
    }
  },
  { immediate: true }
)
</script>

<style lang="postcss" scoped>
.app-navigation {
  .loader {
    padding-block-start: 4rem;
  }
}

.story-navigation {
  flex-shrink: 0;
  overflow: auto;
  width: 35rem;
  border-inline-end: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-secondary);
}
</style>
