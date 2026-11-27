<template>
  <UiRichCheckbox
    :model-value
    :description
    accent="brand"
    @update:model-value="value => emit('update:modelValue', value === true)"
  >
    <slot />
    <template v-if="slots.tag" #tag>
      <slot name="tag" />
    </template>
  </UiRichCheckbox>
</template>

<script lang="ts" setup>
import UiRichCheckbox from '@core/components/ui/rich-checkbox/UiRichCheckbox.vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  modelValue: boolean | undefined
  description?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const slots = defineSlots<{
  default(): any
  tag?(): any
}>()
</script>
