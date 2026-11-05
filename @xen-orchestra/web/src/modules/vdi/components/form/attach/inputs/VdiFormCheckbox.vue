<template>
  <UiCheckbox v-model="model" accent="brand" :disabled>
    {{ label }}
    <template v-if="slots.info" #info>
      <slot name="info" />
    </template>
  </UiCheckbox>
</template>

<script lang="ts" setup>
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'

defineProps<{
  label: string
  disabled?: boolean
}>()

const model = defineModel<boolean>({ required: true })

const slots = defineSlots<{
  info?(): any
}>()
</script>
