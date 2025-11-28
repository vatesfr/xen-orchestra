<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      prop('size').enum('small', 'medium').preset('medium').widget(),
      prop('disabled').bool().widget(),
      prop('rich').bool().widget(),
      prop('src').str().help('Image URL for rich mode'),
      prop('alt').str().help('Alt text for image'),
      slot().help('Meant to receive a label'),
      setting('defaultSlot').widget(text()).preset('Label'),
    ]"
  >
    <div class="radio">
      <UiRadioButton
        v-model="selectedRadio"
        value="1"
        v-bind="properties"
        :src="properties.rich ? imageUrl : undefined"
        :alt="properties.rich ? properties.alt : undefined"
      >
        {{ settings.defaultSlot }}
      </UiRadioButton>

      <UiRadioButton
        v-model="selectedRadio"
        value="2"
        v-bind="properties"
        :src="properties.rich ? imageUrl : undefined"
        :alt="properties.rich ? properties.alt : undefined"
      >
        {{ settings.defaultSlot }}
      </UiRadioButton>
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
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
