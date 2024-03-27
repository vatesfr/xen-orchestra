<template>
  <ComponentStory v-slot="{ properties }" :params="[iconProp().preset(faServer).required()]">
    <TreeList>
      <TreeLoadingItem v-bind="properties" />
    </TreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp } from '@/libs/story/story-param'
import TreeList from '@core/components/tree/TreeList.vue'
import TreeLoadingItem from '@core/components/tree/TreeLoadingItem.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
</script>
