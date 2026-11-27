<template>
  <div class="vts-input-wrapper">
    <UiLabel :accent="labelAccent" :for="id" :href="learnMoreUrl" :required="wrapperController.required" class="label">
      <slot name="label">{{ label }}</slot>
    </UiLabel>
    <slot />
    <UiInfo
      v-for="({ content, accent }, index) of messages"
      :id="messageIds[index]"
      :key="content"
      :accent
      :wrap="wrapMessage"
    >
      <slot name="message" :content :accent>{{ content }}</slot>
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLabel, { type LabelAccent } from '@core/components/ui/label/UiLabel.vue'
import { useRanked } from '@core/composables/ranked.composable.ts'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { IK_INPUT_WRAPPER_CONTROLLER } from '@core/utils/injection-keys.util.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { useArrayMap } from '@vueuse/core'
import { computed, provide, reactive, useId } from 'vue'

export type InputWrapperMessage = MaybeArray<string | { content: string; accent?: InfoAccent }>

export type InputWrapperAccent = 'neutral' | 'success' | 'warning' | 'danger'

export type InputWrapperController = {
  id: string
  accent: InputWrapperAccent
  required: boolean
  describedBy: string | undefined
  invalid: boolean
}

const { message: rawMessage } = defineProps<{
  label?: string
  learnMoreUrl?: string
  message?: InputWrapperMessage
  wrapMessage?: boolean
}>()

defineSlots<{
  default(): any
  label?(): any
  message?(props: { content: string; accent: InfoAccent }): any
}>()

const id = useId()

const unsortedMessages = useArrayMap(
  () => toArray(rawMessage),
  item => ({
    content: typeof item === 'object' ? item.content : item,
    accent: typeof item === 'object' ? (item.accent ?? 'info') : 'info',
  })
)

const messages = useRanked(unsortedMessages, ({ accent }) => accent, ['muted', 'info', 'success', 'warning', 'danger'])

const messageAccent = useMapper<InfoAccent, InputWrapperAccent>(
  () => messages.value.at(-1)?.accent,
  {
    info: 'neutral',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    muted: 'neutral',
  },
  'info'
)

const labelAccent = computed<LabelAccent>(() => (messageAccent.value === 'success' ? 'neutral' : messageAccent.value))

const messageIds = computed(() => messages.value.map((_, index) => `${id}-message-${index}`))

const describedBy = computed(() => (messageIds.value.length > 0 ? messageIds.value.join(' ') : undefined))

const invalid = computed(() => messages.value.some(({ accent }) => accent === 'danger'))

const wrapperController = reactive({
  id,
  accent: messageAccent,
  required: false,
  describedBy,
  invalid,
}) satisfies InputWrapperController

provide(IK_INPUT_WRAPPER_CONTROLLER, wrapperController)
</script>

<style lang="postcss" scoped>
.vts-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;

  .label {
    min-height: 2.4rem;
  }
}
</style>
