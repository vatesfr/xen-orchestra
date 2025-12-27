<template>
  <div class="vts-query-builder-tree-line" :class="{ last }" />
</template>

<script lang="ts" setup>
defineProps<{
  last?: boolean
}>()
</script>

<style lang="postcss" scoped>
.vts-query-builder-tree-line {
  display: flex;
  flex-direction: column;
  margin-inline-start: 1rem;

  &::before,
  &::after {
    content: '';
    border-left: 0.3rem solid #00000060;
    padding-left: 2rem;
  }

  &::before {
    height: 3rem;
    border-bottom: 0.3rem solid #00000060;
  }

  &::after {
    flex: 1;
  }

  &.last {
    &::before {
      height: 2rem;
    }
    &::after {
      border-left: none;
    }
  }
}
</style>
