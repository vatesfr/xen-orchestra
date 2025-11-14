<template>
  <div class="vts-quick-info-column">
    <slot />
  </div>
</template>

<style lang="postcss" scoped>
.vts-quick-info-column {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  width: 100%;
}
</style>
