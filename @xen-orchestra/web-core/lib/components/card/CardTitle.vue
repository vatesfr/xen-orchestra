<!-- v1.0 -->
<template>
  <div class="card-title">
    <div class="left-blok">
      <div class="title-and-counter">
        <span class="typo h6-medium"><slot name="left"></slot></span>
        <UiCounter v-if="count" class="count" :value="count" :color="counterColor" />
      </div>
      <span class="typo p3-regular bottom-left"><slot name="bottom-left"></slot></span>
    </div>

    <div class="right-blok">
      <span class="typo h7-semi-bold right"> <slot name="right"></slot></span>
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiCounter from '@core/components/UiCounter.vue'
import type { CounterColor } from '@core/types/color.type'

defineProps<{
  count?: number
  counterColor?: CounterColor
}>()
</script>

<style lang="postcss" scoped>
.card-title {
  display: flex;
  justify-content: space-between;
}

.left-blok {
  display: flex;
  flex-direction: column;
}

.right-blok {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  height: fit-content;
}

.title-and-counter {
  display: flex;
  align-items: center;
  gap: 1.6rem;
}

.right {
  color: var(--color-purple-base);
}

.bottom-left {
  color: var(--color-grey-300);
}

.count {
  font-size: 1.6rem;
}
</style>
