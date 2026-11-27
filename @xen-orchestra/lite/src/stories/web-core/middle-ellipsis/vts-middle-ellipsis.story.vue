<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('text')
        .str()
        .required()
        .preset('prod-web-frontend-eu-west-01')
        .widget()
        .help('Rendered as is when it fits, cut in the middle otherwise, with the full text in a tooltip'),
      prop('tailLength').num().default(10).widget().help('Number of characters kept visible at the end of a cut text'),
      setting('width').widget(number()).preset(15).help('Available width, in rem'),
    ]"
  >
    <VtsMiddleEllipsis v-bind="properties" :style="{ width: `${settings.width}rem` }" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting } from '@/libs/story/story-param.ts'
import { number } from '@/libs/story/story-widget.ts'
import VtsMiddleEllipsis from '@core/components/middle-ellipsis/VtsMiddleEllipsis.vue'
</script>
