<template>
  <div class="vts-input-wrapper">
    <UiLabel
      :accent="labelAccent"
      :for="id"
      :href="learnMoreUrl"
      :icon
      :required="wrapperController.required"
      class="label"
    >
      <slot name="label">{{ label }}</slot>
    </UiLabel>
    <slot />
    <UiInfo v-for="{ content, accent } of messages" :key="content" :accent>
      {{ content }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLabel, { type LabelAccent } from '@core/components/ui/label/UiLabel.vue'
import { useMapper } from '@core/composables/mapper.composable'
import { useRanked } from '@core/composables/ranked.composable.ts'
import type { MaybeArray } from '@core/types/utility.type'
import { IK_INPUT_WRAPPER_CONTROLLER } from '@core/utils/injection-keys.util'
import { toArray } from '@core/utils/to-array.utils'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { useArrayMap } from '@vueuse/core'
import { provide, reactive, useId } from 'vue'

export type InputWrapperMessage = MaybeArray<string | { content: string; accent?: InfoAccent }>

export type InputWrapperController = {
  id: string
  labelAccent: LabelAccent
  required: boolean
}

const { message: _message } = defineProps<{
  label?: string
  learnMoreUrl?: string
  icon?: IconDefinition
  message?: InputWrapperMessage
}>()

defineSlots<{
  default(): any
  label?(): any
}>()

const id = useId()

const unsortedMessages = useArrayMap(
  () => toArray(_message),
  item => ({
    content: typeof item === 'object' ? item.content : item,
    accent: typeof item === 'object' ? (item.accent ?? 'info') : 'info',
  })
)

const messages = useRanked(unsortedMessages, ({ accent }) => accent, ['danger', 'warning', 'success', 'info'])

const labelAccent = useMapper<InfoAccent, LabelAccent>(
  () => messages.value[0]?.accent,
  {
    info: 'neutral',
    success: 'neutral',
    warning: 'warning',
    danger: 'danger',
    muted: 'neutral',
  },
  'neutral'
)

const wrapperController = reactive({
  id,
  labelAccent,
  required: false,
}) satisfies InputWrapperController

provide(IK_INPUT_WRAPPER_CONTROLLER, wrapperController)
</script>

<style lang="postcss" scoped>
.vts-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .label {
    min-height: 2.4rem;
  }
}
</style>
