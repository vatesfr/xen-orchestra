<template>
  <dl class="vts-key-value-list">
    <slot />
  </dl>
</template>

<style lang="postcss" scoped>
.vts-key-value-list {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
