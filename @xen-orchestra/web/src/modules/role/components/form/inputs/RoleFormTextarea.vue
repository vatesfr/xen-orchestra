<template>
  <UiTextarea v-model.trim="model" accent="neutral">
    {{ label }}
  </UiTextarea>
</template>

<script lang="ts" setup>
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'

defineProps<{
  label: string
}>()

const model = defineModel<string>({ required: true })
</script>
