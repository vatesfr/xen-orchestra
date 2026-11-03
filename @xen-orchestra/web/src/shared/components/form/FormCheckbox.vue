<template>
  <div class="form-checkbox">
    <UiCheckbox
      :model-value
      accent="brand"
      :disabled
      @update:model-value="value => emit('update:modelValue', value === true)"
    >
      <slot>{{ label }}</slot>
      <template v-if="slots.info || info" #info>
        <slot name="info">{{ info }}</slot>
      </template>
    </UiCheckbox>
    <UiInfo v-for="message of warningMessages" :key="message" accent="warning" wrap>
      {{ message }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const { warning } = defineProps<{
  label?: string
  modelValue: boolean | undefined
  info?: string
  warning?: InputWrapperMessage
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const warningMessages = computed(() =>
  toArray(warning).map(message => (typeof message === 'object' ? message.content : message))
)
</script>

<style lang="postcss" scoped>
.form-checkbox {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
