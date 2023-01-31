<template>
  <div class="ui-card-spinner">
    <UiSpinner />
  </div>
</template>

<script lang="ts" setup>
import UiSpinner from "@/components/ui/UiSpinner.vue";
</script>

<style lang="postcss" scoped>
.ui-card-spinner {
  font-size: 5rem;
  display: flex;
  justify-content: center;
  margin: 4rem 0 2rem;
  color: var(--color-extra-blue-base);
}
</style>
