<!-- v1.0 -->
<template>
  <header class="mobile-head-bar typo p2-medium">
    <ButtonIcon :icon="faAngleLeft" color="info" @click="emit('close')" />
    <slot />
  </header>
</template>

<script lang="ts" setup>
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons'

const emit = defineEmits<{
  close: []
}>()
</script>

<style lang="postcss" scoped>
.mobile-head-bar {
  align-items: center;
  display: flex;

  background-color: var(--background-color-primary);
  border-bottom: 0.1rem solid var(--color-grey-500);
  height: 4rem;
  padding: 0.8rem 1.6rem;
  gap: 0.8rem;
}
</style>
