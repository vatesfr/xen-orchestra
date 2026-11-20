<template>
  <section class="new-vm-section">
    <UiTitle>{{ title }}</UiTitle>
    <slot />
  </section>
</template>

<script lang="ts" setup>
import UiTitle from '@core/components/ui/title/UiTitle.vue'

defineProps<{
  title: string
}>()

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.new-vm-section {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
