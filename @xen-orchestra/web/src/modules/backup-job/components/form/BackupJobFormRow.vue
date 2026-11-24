<template>
  <div class="backup-job-form-row">
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.backup-job-form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.4rem;

  & > * {
    width: auto;
  }

  @media (--medium-or-large) {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
