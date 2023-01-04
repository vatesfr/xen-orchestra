<template>
  <p class="scale">
    <span>0%</span>
    <span v-for="n in scale" :key="n">{{ n }}00%</span>
  </p>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    scale?: number;
  }>(),
  { scale: 1 }
);
</script>

<style lang="postcss">
.scale {
  color: var(--color-blue-scale-300);
  display: flex;
  font-size: 12px;
  font-weight: 400;
  justify-content: space-between;
  letter-spacing: 0.04em;
  line-height: 16px;
}
</style>
