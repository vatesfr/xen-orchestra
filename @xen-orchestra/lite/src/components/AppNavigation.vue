<template>
  <nav ref="navElement" :class="{ collapsed: !isOpen }" class="app-navigation">
    <div v-if="route.meta.hasStoryNav" class="story-menu">
      <StoryMenu />
    </div>
    <PoolTreeView v-else />
  </nav>
</template>

<script lang="ts" setup>
import StoryMenu from '@/components/component-story/StoryMenu.vue'
import PoolTreeView from '@/modules/treeview/components/PoolTreeView.vue'
import { useNavigationStore } from '@/stores/navigation.store.ts'
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const navigationStore = useNavigationStore()
const { isOpen } = storeToRefs(navigationStore)

const navElement = ref()

watch(
  () => navigationStore.trigger?.value,
  triggerElement => {
    if (triggerElement && navElement.value) {
      onClickOutside(
        navElement,
        () => {
          if (isOpen.value) {
            isOpen.value = false
          }
        },
        {
          ignore: [triggerElement],
        }
      )
    }
  },
  { immediate: true }
)
</script>

<style lang="postcss" scoped>
.app-navigation {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  width: 37rem;
  max-width: 37rem;
  height: 100%;
  border-right: 1px solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-secondary);
  transition:
    margin-inline 0.25s,
    visibility 0.25s;

  &.collapsed {
    visibility: hidden;
    margin-inline-start: -37rem;
  }
}

.story-menu {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
