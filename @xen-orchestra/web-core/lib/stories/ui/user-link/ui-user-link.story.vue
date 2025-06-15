<template>
  <ComponentStory :params>
    <UiUserLink v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiUserLink from '@core/components/ui/user-link/UiUserLink.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    username: {
      preset: 'Username',
      required: true,
    },
    route: {
      preset: ref<string>(),
      type: 'string',
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
})
</script>
