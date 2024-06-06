<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[slot(), setting('defaultSlotContent').preset('Here is a basic modal...').widget(text())]"
  >
    <BasicModalLayout>
      {{ settings.defaultSlotContent }}
    </BasicModalLayout>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import BasicModalLayout from '@/components/ui/modals/layouts/BasicModalLayout.vue'
import { setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
</script>
