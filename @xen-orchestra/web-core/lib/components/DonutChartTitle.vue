<template>
  <span v-if="title" class="chart-title">{{ title.toUpperCase() }}</span>
</template>
<script setup lang="ts">
defineProps({
  title: String,
})
</script>
<style lang="postcss" scoped>
.chart-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--color-grey-200);
}
</style>
