<template>
  <transition name="slide">
    <nav
      v-if="isDesktop || isOpen"
      ref="navElement"
      :class="{ collapsible: isMobile }"
      class="app-navigation"
    >
      <StoryMenu v-if="$route.meta.hasStoryNav" />
      <InfraPoolList v-else />
    </nav>
  </transition>
</template>

<script lang="ts" setup>
import StoryMenu from "@/components/component-story/StoryMenu.vue";
import InfraPoolList from "@/components/infra/InfraPoolList.vue";
import { useNavigationStore } from "@/stores/navigation.store";
import { useUiStore } from "@/stores/ui.store";
import { onClickOutside, whenever } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { ref } from "vue";

const uiStore = useUiStore();
const { isMobile, isDesktop } = storeToRefs(uiStore);

const navigationStore = useNavigationStore();
const { isOpen, trigger } = storeToRefs(navigationStore);

const navElement = ref();

whenever(isOpen, () => {
  const unregisterEvent = onClickOutside(
    navElement,
    () => {
      isOpen.value = false;
      unregisterEvent?.();
    },
    {
      ignore: [trigger],
    }
  );
});
</script>

<style lang="postcss" scoped>
.app-navigation {
  overflow: auto;
  width: 37rem;
  max-width: 37rem;
  height: calc(100vh - 8rem);
  padding: 0.5rem;
  border-right: 1px solid var(--color-blue-scale-400);
  background-color: var(--background-color-primary);

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
