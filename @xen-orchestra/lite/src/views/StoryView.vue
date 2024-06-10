<template>
  <TitleBar :icon="faBook">
    {{ title }}
  </TitleBar>
  <RouterView />
</template>

<script lang="ts" setup>
import TitleBar from '@/components/TitleBar.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { faBook } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const { currentRoute } = useRouter()

const title = computed(() => {
  if (!currentRoute.value.meta.isStory) {
    return 'Components Stories'
  }

  return `${currentRoute.value.meta.storyTitle} Story`
})

usePageTitleStore().setTitle(title)
</script>
