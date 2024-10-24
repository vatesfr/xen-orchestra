<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[
      slot(),
      setting('message').help('Content for default slot').preset('Error, can\'t collect data').widget(),
    ]"
  >
    <VtsTreeList>
      <VtsTreeItemError>{{ settings.message }}</VtsTreeItemError>
    </VtsTreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param'
import VtsTreeItemError from '@core/components/tree/VtsTreeItemError.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
</script>
