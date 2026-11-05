<template>
  <form novalidate @submit.prevent="emit('submit')">
    <slot />
  </form>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  submit: []
}>()

defineSlots<{
  default(): any
}>()
</script>
