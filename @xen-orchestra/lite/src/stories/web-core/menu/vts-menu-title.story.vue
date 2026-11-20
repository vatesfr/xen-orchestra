<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[slot().help('Title of the section'), setting('title').preset('Change state').widget(text())]"
  >
    <MenuList>
      <VtsMenuTitle>{{ settings.title }}</VtsMenuTitle>
      <MenuItem accent="neutral" icon="fa:play">Start</MenuItem>
      <MenuItem accent="neutral" icon="action:reboot">Reboot</MenuItem>
    </MenuList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param.ts'
import { text } from '@/libs/story/story-widget.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsMenuTitle from '@core/components/menu/VtsMenuTitle.vue'
</script>
