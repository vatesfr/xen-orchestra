<template>
  <ComponentStory v-slot="{ properties }" :params="[iconProp().preset('object:host').required()]">
    <VtsTreeList>
      <VtsTreeLoadingItem v-bind="properties" />
    </VtsTreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp } from '@/libs/story/story-param'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
</script>
