<!-- v1.0 -->
<template>
  <div class="card-subtitle">
    <span class="typo h7-semi-bold"><slot name="left" /></span>
    <span class="typo p3-medium"><slot name="right" /></span>
  </div>
</template>
<style lang="postcss" scoped>
.card-subtitle {
  color: var(--color-purple-base);
  border-bottom: 1px solid var(--color-purple-base);
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
}
</style>
