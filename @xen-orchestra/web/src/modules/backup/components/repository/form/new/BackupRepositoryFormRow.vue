<template>
  <div :class="{ wide }" class="backup-repository-form-row">
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  wide?: boolean
}>()

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.backup-repository-form-row {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  & > * {
    width: 100%;
    min-width: 0;
  }

  @media (--medium-or-large) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    align-items: end;

    & > * {
      width: auto;
    }

    &.wide {
      grid-template-columns: 1fr;
    }
  }
}
</style>
