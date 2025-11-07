<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      prop('disabled').bool().widget(),
      prop('size').required().enum('small', 'medium').preset('medium').widget(),
      slot(),
      slot().help('Meant to receive a label'),
      setting('defaultSlot').widget(text()).preset('Label'),
    ]"
  >
    <div>
      <UiRichRadioButton v-model="selectedRichRadio" accent="warning" value="1" size="small" v-bind="properties">
        <img alt="color mode light" src="../../../../assets/color-mode-dark.svg" />
        <template #label>
          {{ settings.defaultSlot }}
        </template>
      </UiRichRadioButton>
    </div>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param.ts'
import { text } from '@/libs/story/story-widget.ts'
import UiRichRadioButton from '@core/components/ui/rich-radio-button/UiRichRadioButton.vue'
import { ref } from 'vue'

const selectedRichRadio = ref('')
</script>
