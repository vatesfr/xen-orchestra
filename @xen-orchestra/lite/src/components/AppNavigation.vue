<template>
  <Transition name="slide">
    <nav v-if="isOpen" ref="navElement" class="app-navigation">
      <StoryMenu v-if="route.meta.hasStoryNav" />
      <InfraPoolList v-else />
    </nav>
  </Transition>
</template>

<script lang="ts" setup>
import StoryMenu from '@/components/component-story/StoryMenu.vue'
import InfraPoolList from '@/components/infra/InfraPoolList.vue'
import { useNavigationStore } from '@/stores/navigation.store'
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
  overflow: auto;
  width: 37rem;
  max-width: 37rem;
  height: calc(100vh - 5.5rem);
  padding: 0.5rem;
  border-right: 1px solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);

  &.collapsible {
    position: fixed;
    z-index: 1;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-37rem);
}
</style>
