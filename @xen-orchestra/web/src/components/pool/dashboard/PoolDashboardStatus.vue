<template>
  <!-- eslint-disable vue/html-self-closing -->
  <div class="pool-dashboard-status"></div>
  <!-- eslint-enable vue/html-self-closing -->
</template>

<style lang="postcss" scoped>
.pool-dashboard-status {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  @media (--desktop) {
    flex-direction: row;
  }
}
</style>
