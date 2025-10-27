<template>
  <UiLabelValue :label :value="tags" ellipsis />
</template>

<script lang="ts" setup>
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'

defineProps<{
  tags: string[]
  label: string
}>()
</script>
