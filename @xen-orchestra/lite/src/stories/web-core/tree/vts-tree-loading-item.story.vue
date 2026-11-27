<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      iconProp().preset('object:host').required(),
      prop('size').enum('small', 'medium').preset('medium').widget(),
    ]"
  >
    <VtsTreeList>
      <VtsTreeLoadingItem v-bind="properties" />
    </VtsTreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop } from '@/libs/story/story-param.ts'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
</script>
