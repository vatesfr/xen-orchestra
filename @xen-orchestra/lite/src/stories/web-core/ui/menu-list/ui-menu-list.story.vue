<template>
  <ComponentStory :params="[slot().help('Meant to receive UiMenuItem components')]">
    <UiMenuList>
      <UiMenuItem v-for="section in sections" :key="section" size="large" to="#" :selected="section === 'General'">
        {{ section }}
      </UiMenuItem>
    </UiMenuList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param.ts'
import UiMenuItem from '@core/components/ui/menu-item/UiMenuItem.vue'
import UiMenuList from '@core/components/ui/menu-list/UiMenuList.vue'

const sections = ['General', 'Groups', 'Roles']
</script>
