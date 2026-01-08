<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      prop('size').required().enum('small', 'medium').preset('medium').widget(),
      prop('disabled').bool().widget(),
      prop('src').required().str().help('Image URL for rich mode'),
      prop('alt').required().str().help('Alt text for image'),
      slot().help('Meant to receive a label'),
      setting('defaultSlot').widget(text()).preset('Label'),
    ]"
  >
    <div class="radio">
      <UiRichRadioButton v-model="selectedRadio" value="1" v-bind="properties" :src="imageUrl" :alt="properties.alt">
        {{ settings.defaultSlot }}
      </UiRichRadioButton>
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiRichRadioButton from '@core/components/ui/rich-radio-button/UiRichRadioButton.vue'
import { ref } from 'vue'
import imageUrl from '../../../../assets/color-mode-dark.svg'

const selectedRadio = ref('')
</script>

<style lang="postcss" scoped>
.radio {
  display: flex;
  gap: 1.6rem;
  flex-wrap: wrap;
}
</style>
