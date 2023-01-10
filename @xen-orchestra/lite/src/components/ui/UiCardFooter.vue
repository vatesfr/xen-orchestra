<template>
  <div class="footer">
    <div class="footer-card">
      <slot name="left" />
    </div>
    <div class="footer-card">
      <slot name="right" />
    </div>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="postcss" scoped>
.footer {
  color: var(--color-blue-scale-200);
  display: flex;
  font-size: 14px;
  justify-content: space-between;
}

.footer-card {
  display: flex;
  text-transform: uppercase;
  width: 45%;
  justify-content: space-between;
}

:deep(.footer-card) p {
  font-weight: 700;
}
</style>
