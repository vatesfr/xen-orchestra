<template>
  <div class="accondion">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'

const expandedKey = ref<string | null>(null)

const toggle = (key: string) => {
  expandedKey.value = expandedKey.value === key ? null : key
}

provide('accordion', {
  expandedKey,
  toggle,
})
</script>

<style scoped lang="postcss">
.accondion {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
