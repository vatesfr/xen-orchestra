<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[
      slot(),
      setting('message').help('Content for default slot').preset('Error, can\'t collect data').widget(),
    ]"
  >
    <TreeList>
      <TreeItemError>{{ settings.message }}</TreeItemError>
    </TreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param'
import TreeItemError from '@core/components/tree/TreeItemError.vue'
import TreeList from '@core/components/tree/TreeList.vue'
</script>
