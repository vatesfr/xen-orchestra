<template>
  <ComponentStory :params :presets>
    <VtsInputWrapper v-bind="bindings">
      <div class="placeholder">Input will be placed here</div>
    </VtsInputWrapper>
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { ref } from 'vue'

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

const { params, bindings } = useStory({
  props: {
    label: {
      preset: 'Some label',
    },
    learnMoreUrl: {
      preset: ref<string>(),
      type: 'string',
    },
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
    message: {
      preset: ref<any[]>(),
      type: 'InputWrapperMessage',
      help: 'See presets',
    },
  },
  slots: {
    default: {},
    label: { help: 'Can be used in place of label prop' },
  },
})

const presets: Record<string, () => void> = {
  'With "info" message': () => {
    bindings.message = withInfo
  },
  '\u21B3 and "success" message': () => {
    bindings.message = withSuccess
  },
  '\u00A0\u00A0\u21B3 and "warning" message': () => {
    bindings.message = withWarning
  },
  '\u00A0\u00A0\u00A0\u00A0\u21B3 and "danger" message': () => {
    bindings.message = withDanger
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
