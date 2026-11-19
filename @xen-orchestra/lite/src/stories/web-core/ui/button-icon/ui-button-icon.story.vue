<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      iconProp().preset('fa:ellipsis'),
      prop('accent').required().enum('brand', 'info', 'warning', 'danger').preset('brand').widget(),
      prop('size').required().enum('small', 'medium', 'large').preset('medium').widget(),
      prop('disabled').bool().widget(),
      prop('selected').bool().widget(),
      prop('counter')
        .type('CounterValue | { value: CounterValue; accent: CounterAccent }')
        .widget(object())
        .help('Info accent by default'),
      prop('targetScale')
        .type('number | { x: number; y: number }')
        .default(1)
        .preset({ x: 2, y: 2 })
        .help('Meant to increase click target size if needed')
        .widget(),
    ]"
    :presets="{
      'No counter': {
        props: {
          icon: 'fa:bars-progress',
          counter: undefined,
        },
      },
      'Number counter': {
        props: {
          icon: 'fa:bars-progress',
          counter: 6,
        },
      },
      'Percentage (warning)': {
        props: {
          icon: 'fa:bars-progress',
          counter: { value: '42%', accent: 'warning' },
        },
      },
      'Exclamation mark (danger)': {
        props: {
          icon: 'fa:bars-progress',
          counter: { value: '!', accent: 'danger' },
        },
      },
    }"
  >
    <UiButtonIcon v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop } from '@/libs/story/story-param.ts'
import { object } from '@/libs/story/story-widget.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
</script>
