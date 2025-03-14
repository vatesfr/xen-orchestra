<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').str().preset('Some label').widget(),
      prop('learnMoreUrl').str().widget(),
      iconProp(),
      prop('message').type('InputWrapperMessage').widget(object()).preset([]).help('See presets'),
      slot(),
      slot('label').help('Can be used in place of label prop'),
    ]"
    :presets
  >
    <VtsInputWrapper v-bind="properties">
      <div class="placeholder">Input will be placed here</div>
    </VtsInputWrapper>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, slot } from '@/libs/story/story-param.ts'
import { object } from '@/libs/story/story-widget.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'

const withInfo = ['Info ']

const withSuccess = [
  ...withInfo,
  {
    content: 'Success',
    accent: 'success',
  },
]
const withWarning = [
  ...withSuccess,
  {
    content: 'Warning',
    accent: 'warning',
  },
]
const withDanger = [
  ...withWarning,
  {
    content: 'Danger',
    accent: 'danger',
  },
]

const presets = {
  'With "info" message': {
    props: {
      message: withInfo,
    },
  },
  '\u21B3 and "success" message': {
    props: {
      message: withSuccess,
    },
  },
  '\u00A0\u00A0\u21B3 and "warning" message': {
    props: {
      message: withWarning,
    },
  },
  '\u00A0\u00A0\u00A0\u00A0\u21B3 and "danger" message': {
    props: {
      message: withDanger,
    },
  },
}
</script>

<style lang="postcss" scoped>
.placeholder {
  border: 1px dashed var(--color-neutral-border);
  border-radius: 0.4rem;
  padding: 0.8rem 1.6rem;
  color: var(--color-neutral-txt-secondary);
  font-style: italic;
}
</style>
