<template>
  <span class="backup-job-review-subtitle typo-body-bold">
    <slot />
  </span>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.backup-job-review-subtitle {
  margin-block-start: 0.8rem;
}
</style>
