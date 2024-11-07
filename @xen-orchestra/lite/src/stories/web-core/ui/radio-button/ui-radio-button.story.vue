<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent')
        .type('RadioButtonAccent')
        .required()
        .enum('info', 'success', 'warning', 'danger')
        .preset('info')
        .widget(),
      prop('disabled').bool().widget(),
      slot(),
      slot('info'),
      setting('defaultSlot').widget(text()).preset('Label'),
      setting('info').widget(text()).preset('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
    ]"
  >
    <div>
      <UiRadioButton v-model="selectedRadio" value="1" v-bind="properties">{{ settings.defaultSlot }}</UiRadioButton>
    </div>
    <div>
      <UiRadioButton v-model="selectedRadio" value="2" v-bind="properties">
        {{ settings.defaultSlot }}
        <template v-if="settings.info" #info>{{ settings.info }}</template>
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

const selectedRadio = ref('')
</script>
