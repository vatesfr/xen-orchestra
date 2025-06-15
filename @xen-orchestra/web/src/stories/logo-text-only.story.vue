<template>
  <ComponentStory :params>
    <LogoTextOnly v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import LogoTextOnly from '@/components/LogoTextOnly.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    short: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
})
</script>
