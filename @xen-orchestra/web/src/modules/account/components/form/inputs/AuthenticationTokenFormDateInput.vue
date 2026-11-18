<template>
  <VtsInputWrapper :label :message="info" wrap-message>
    <UiInput v-model="model" accent="brand" type="date" :min :max />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'

defineProps<{
  label: string
  info?: string
  min?: string
  max?: string
}>()

const model = defineModel<string>({ required: true })
</script>
