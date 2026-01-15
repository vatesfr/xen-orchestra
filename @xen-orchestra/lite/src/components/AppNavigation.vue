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
import { onClickOutside, tryOnMounted, useTimeoutFn, watchImmediate } from '@vueuse/core'
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
  if (!id) {
    return
  }

  const container = navElement.value as HTMLElement | undefined
  const target = container?.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(id)}"]`)

  if (target) {
    useTimeoutFn(async () => {
      target.scrollIntoView({ block: !id.startsWith('vm:') ? 'start' : 'center', behavior: 'smooth' })
    }, 200)
  } else {
    useTimeoutFn(async () => {
      await scrollToCurrent()
    }, 200)
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
}
</style>
