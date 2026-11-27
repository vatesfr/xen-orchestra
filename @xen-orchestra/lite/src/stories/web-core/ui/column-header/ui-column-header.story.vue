<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('interactive').required().bool().widget(),
      prop('selected').required().bool().widget(),
      prop('disabled').bool().widget().ctx(),
      iconProp(),
      event('click'),
      slot(),
      setting('defaultSlotContent').preset('VM description').widget(text()).help('Content for default slot'),
    ]"
  >
    <table>
      <thead>
        <tr>
          <UiColumnHeader v-bind="properties">
            {{ settings.defaultSlotContent }}
          </UiColumnHeader>
        </tr>
      </thead>
    </table>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, iconProp, prop, setting, slot } from '@/libs/story/story-param.ts'
import { text } from '@/libs/story/story-widget.ts'
import UiColumnHeader from '@core/components/ui/column-header/UiColumnHeader.vue'
</script>
