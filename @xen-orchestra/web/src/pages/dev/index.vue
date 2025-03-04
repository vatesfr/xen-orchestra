<template>
  <div class="circle">
    <UiCircleProgressBar variant="primary" accent="info" size="extra-small" :value="25" :max-value="100" />
    <UiCircleProgressBar variant="primary" accent="warning" size="small" :value="25" :max-value="100" />
    <UiCircleProgressBar variant="primary" accent="danger" size="medium" :value="50" :max-value="100" />
    <UiCircleProgressBar variant="primary" accent="info" size="large" :value="99" :max-value="100" />
    <UiCircleProgressBar variant="primary" accent="success" size="large" :value="50" :max-value="100" />
  </div>
</template>

<script lang="ts" setup>
import UiCircleProgressBar from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
</script>

<style lang="postcss" scoped>
.circle {
  padding: 20rem;
  display: flex;
  gap: 10rem;
}
</style>
