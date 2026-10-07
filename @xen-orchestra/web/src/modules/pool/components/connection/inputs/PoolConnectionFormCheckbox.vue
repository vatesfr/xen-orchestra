<template>
  <UiCheckbox v-model="model" accent="brand">
    {{ label }}
  </UiCheckbox>
</template>

<script lang="ts" setup>
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  label: string
}>()

const model = defineModel<boolean>({ required: true })
</script>
