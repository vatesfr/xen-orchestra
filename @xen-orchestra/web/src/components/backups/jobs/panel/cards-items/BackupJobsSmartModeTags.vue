<template>
  <UiLabelValue :label :value="tags" />
</template>

<script lang="ts" setup>
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'

defineProps<{
  tags: string[]
  label: string
}>()
</script>
