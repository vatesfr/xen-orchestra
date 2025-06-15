<template>
  <ComponentStory :params>
    <UiUserLogo v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiUserLogo, { type UserLogoSize } from '@core/components/ui/user-logo/UiUserLogo.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'

const { params, bindings } = useStory({
  props: {
    size: {
      type: 'UserLogoSize',
      preset: 'medium' as UserLogoSize,
      widget: choice<UserLogoSize>('extra-small', 'small', 'medium'),
      required: true,
    },
  },
})
</script>
