<template>
  <Transition name="slide">
    <nav v-if="isOpen" ref="navElement" class="app-navigation">
      <div v-if="route.meta.hasStoryNav" class="story-menu">
        <StoryMenu />
      </div>
      <PoolTreeView v-else />
    </nav>
  </Transition>
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
  overflow: hidden;
  width: 37rem;
  max-width: 37rem;
  height: calc(100vh - 5.5rem);
  border-right: 1px solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-secondary);
}

.story-menu {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
