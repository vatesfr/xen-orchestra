<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').type('RichCheckboxAccent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      iconProp(),
      prop('tag').str().widget().preset('Label'),
      prop('description').str().widget().preset('Description'),
      prop('info').str().widget(),
      prop('message').str().widget().help('Only displayed when the accent is not brand'),
      prop('disabled').bool().widget(),
      model().type('boolean | undefined').preset(undefined).help('undefined means partly checked'),
      slot().help('Meant to receive the label'),
      slot('tag').help('Meant to receive a UiTag component, to use another accent than the default info one'),
      slot('description'),
      slot('info'),
      slot('message'),
      setting('defaultSlot').widget(text()).preset('Label'),
    ]"
  >
    <div class="checkbox">
      <UiRichCheckbox v-bind="properties">
        {{ settings.defaultSlot }}
      </UiRichCheckbox>
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, model, prop, setting, slot } from '@/libs/story/story-param.ts'
import { text } from '@/libs/story/story-widget.ts'
import UiRichCheckbox from '@core/components/ui/rich-checkbox/UiRichCheckbox.vue'
</script>

<style lang="postcss" scoped>
.checkbox {
  max-width: 40rem;
}
</style>
