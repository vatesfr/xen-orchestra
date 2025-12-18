<template>
  <Transition name="slide">
    <nav
      v-if="uiStore.isDesktopLarge || isOpen"
      ref="navElement"
      :class="{ collapsible: !uiStore.isDesktopLarge }"
      class="app-navigation"
    >
      <StoryMenu v-if="route.meta.hasStoryNav" />
      <InfraPoolList v-else />
    </nav>
  </Transition>
</template>

<script lang="ts" setup>
import StoryMenu from '@/components/component-story/StoryMenu.vue'
import InfraPoolList from '@/components/infra/InfraPoolList.vue'
import { useNavigationStore } from '@/stores/navigation.store'
import { useUiStore } from '@core/stores/ui.store'
import { onClickOutside, whenever, useTimeoutFn, tryOnMounted, watchImmediate } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const uiStore = useUiStore()

const navigationStore = useNavigationStore()
const { isOpen, trigger } = storeToRefs(navigationStore)

const navElement = ref()

whenever(isOpen, () => {
  const unregisterEvent = onClickOutside(
    navElement,
    () => {
      isOpen.value = false
      unregisterEvent?.()
    },
    {
      ignore: [trigger],
      controls: false,
    }
  )
})

const getCurrentNodeId = () => {
  const name = route.name as string | undefined
  const params = route.params as Record<string, any>
  if (name?.startsWith('/pool/[uuid]')) {
    return `pool:${params.uuid}`
  }
  if (name?.startsWith('/host/[uuid]')) {
    return `host:${params.uuid}`
  }
  if (name?.startsWith('/vm/[uuid]')) {
    return `vm:${params.uuid}`
  }

  return undefined
}

const scrollToCurrent = async () => {
  const id = getCurrentNodeId()
  if (!id) return

  const container = navElement.value as HTMLElement | undefined
  const target = container?.querySelector(`[data-node-id="${CSS.escape(id)}"]`)

  if (target && 'scrollIntoView' in target) {
    const el = target as HTMLElement
    el.scrollIntoView({ block: !id.startsWith('vm:') ? 'start' : 'center', behavior: 'smooth' })
  } else {
    useTimeoutFn(async () => {
      await scrollToCurrent()
    }, 1200)
  }
}

tryOnMounted(scrollToCurrent)
watchImmediate(route, scrollToCurrent)
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
</style>
