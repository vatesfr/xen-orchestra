<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent')
        .type('RichRadioButtonAccent')
        .required()
        .enum('brand', 'warning', 'danger')
        .preset('brand')
        .widget(),
      iconProp(),
      prop('tag').str().widget().preset('Label'),
      prop('description').str().widget().preset('Description'),
      prop('info').str().widget(),
      prop('disabled').bool().widget(),
      model().type('string'),
      slot().help('Meant to receive the label'),
      slot('tag').help('Meant to receive a UiTag component, to use another accent than the default info one'),
      slot('description'),
      slot('info'),
      setting('defaultSlot').widget(text()).preset('Label'),
    ]"
  >
    <div class="radios">
      <UiRichRadioButton v-model="selectedRadio" v-bind="properties" value="1">
        {{ settings.defaultSlot }}
      </UiRichRadioButton>
      <UiRichRadioButton v-model="selectedRadio" v-bind="properties" value="2">
        {{ settings.defaultSlot }}
      </UiRichRadioButton>
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, model, prop, setting, slot } from '@/libs/story/story-param.ts'
import { text } from '@/libs/story/story-widget.ts'
import UiRichRadioButton from '@core/components/ui/rich-radio-button/UiRichRadioButton.vue'
import { ref } from 'vue'

const selectedRadio = ref('')
</script>

<style lang="postcss" scoped>
.radios {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-width: 40rem;
}
</style>
