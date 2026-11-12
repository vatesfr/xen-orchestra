<template>
  <div class="v2v-launch-group-vm typo-body-regular-small">
    <span class="typo-body-bold-small"><slot name="name" /></span>
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineSlots<{
  name(): any
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.v2v-launch-group-vm {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}
</style>
