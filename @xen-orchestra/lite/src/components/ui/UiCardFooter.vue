<template>
  <div class="footer typo c2-semi-bold">
    <div class="footer-card">
      <slot name="left" />
    </div>
    <div class="footer-card">
      <slot name="right" />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.footer {
  color: var(--color-grey-200);
  display: flex;
  justify-content: space-between;
}

.footer-card {
  display: flex;
  width: 45%;
  justify-content: space-between;
}
</style>
