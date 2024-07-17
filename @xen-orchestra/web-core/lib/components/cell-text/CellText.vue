<!-- v1.0 -->
<template>
  <td class="cell-text">
    <div class="data typo p2-regular">
      <slot />
      <span v-if="slots.secondary" class="info typo p4-regular">
        <slot name="secondary" />
      </span>
    </div>
  </td>
</template>

<script lang="ts" setup>
const slots = defineSlots<{
  default: () => any
  secondary?: () => any
}>()
</script>

<style lang="postcss" scoped>
.cell-text {
  padding: 0.8rem;
  border: 0.1rem solid var(--color-grey-500);
  color: var(--color-grey-000);
}

.data {
  display: flex;
  gap: 1.6rem;
  align-items: center;
}

.info {
  color: var(--color-grey-300);
}
</style>
