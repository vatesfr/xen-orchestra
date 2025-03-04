<template>
  <div class="vts-quick-info-row">
    <span class="typo-body-bold">
      <slot name="title">
        {{ title }}
      </slot>
    </span>
    <span class="typo-body-regular">
      <slot name="value">
        {{ value }}
      </slot>
    </span>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title?: string
  value?: string
}>()

defineSlots<{
  title?(): any
  value?(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-quick-info-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}
</style>
