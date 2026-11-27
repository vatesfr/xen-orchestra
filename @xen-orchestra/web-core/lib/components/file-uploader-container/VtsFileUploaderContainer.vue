<template>
  <div class="vts-file-uploader-container">
    <slot />
    <slot name="file-list" />
  </div>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
  'file-list'?(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-file-uploader-container {
  display: flex;
  gap: 0.8rem;
  flex-direction: column;
  container-type: inline-size;
  container-name: vts-file-uploader-container;
}
</style>
