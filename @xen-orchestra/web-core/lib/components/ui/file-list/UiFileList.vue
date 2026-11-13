<!-- v1 -->
<template>
  <ul class="ui-file-list">
    <slot />
  </ul>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-file-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  @container vts-file-uploader-container (min-width: 80rem) {
    flex-direction: row;
    flex-wrap: wrap;

    > :slotted(*) {
      flex: 1 1 32rem;
    }
  }
}
</style>
