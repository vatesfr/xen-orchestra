<template>
  <ComponentStory :params>
    <VtsTreeList>
      <VtsTreeLoadingItem v-bind="bindings" />
    </VtsTreeList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    icon: {
      preset: ref<IconDefinition>(faServer),
      type: 'IconDefinition',
      required: true,
      widget: iconChoice(),
    },
  },
})
</script>
