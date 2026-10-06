<template>
  <VtsLayoutSidebar v-if="hasStoryNav">
    <StoryMenu />
  </VtsLayoutSidebar>
  <PoolTreeSidebar v-else />
</template>

<script lang="ts" setup>
import StoryMenu from '@/components/component-story/StoryMenu.vue'
import PoolTreeSidebar from '@/modules/treeview/components/PoolTreeSidebar.vue'
import VtsLayoutSidebar from '@core/components/layout/VtsLayoutSidebar.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const hasStoryNav = computed(() => route.meta.hasStoryNav === true)
</script>
