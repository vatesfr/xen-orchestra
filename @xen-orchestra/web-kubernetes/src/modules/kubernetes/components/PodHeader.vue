<template>
  <UiHeadBar icon="object:pod">
    {{ name }}
  </UiHeadBar>
</template>

<script setup lang="ts">
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'

defineProps<{
  name: string
}>()
</script>
