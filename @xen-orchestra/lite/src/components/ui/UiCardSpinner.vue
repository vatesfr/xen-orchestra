<template>
  <div class="ui-card-spinner">
    <UiSpinner class="spinner" />
  </div>
</template>

<script lang="ts" setup>
import UiSpinner from '@/components/ui/UiSpinner.vue'
</script>

<style lang="postcss" scoped>
.ui-card-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
}

.spinner {
  color: var(--color-normal-txt-base);
  font-size: 4rem;
}
</style>
