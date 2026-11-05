<template>
  <div class="vts-button-group" :class="{ 'no-stack': noStack }">
    <div class="line">
      <slot />
    </div>
    <div v-if="slots.tertiary" class="line">
      <slot name="tertiary" />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  noStack?: boolean
}>()

const slots = defineSlots<{
  default(): any
  tertiary?(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-button-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.6rem;

  .line {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.6rem;

    @media (--small) {
      flex-direction: column-reverse;
    }
  }

  &.no-stack .line {
    @media (--small) {
      flex-direction: row;
    }
  }
}
</style>
