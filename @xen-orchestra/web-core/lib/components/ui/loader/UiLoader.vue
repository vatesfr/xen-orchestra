<!-- Adapted from https://www.benmvp.com/blog/how-to-create-circle-svg-gradient-loading-spinner/ -->

<!-- v2 -->
<template>
  <div>
  <svg class="ui-loader" fill="none" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient :id="secondHalfId">
        <stop offset="0%" stop-color="currentColor" stop-opacity="0" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0.5" />
      </linearGradient>
      <linearGradient :id="firstHalfId">
        <stop offset="0%" stop-color="currentColor" stop-opacity="1" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0.5" />
      </linearGradient>
    </defs>

      <g stroke-width="40">
        <path :stroke="`url(#${secondHalfId})`" d="M 30 200 A 170 170 180 0 1 370 200" />
        <path :stroke="`url(#${firstHalfId})`" d="M 370 200 A 170 170 0 0 1 30 200" />
        <path d="M 30 200 A 170 170 180 0 1 30 200" stroke="currentColor" stroke-linecap="round" />
      </g>
    </svg>
  </div>
</template>

<script lang="ts" setup>
import { uniqueId } from '@core/utils/unique-id.util'

const firstHalfId = uniqueId('spinner-first-half-')
const secondHalfId = uniqueId('spinner-second-half-')
</script>

<style lang="postcss" scoped>
.ui-loader {
  display: flex;
  width: 1.2em;
  height: 1.2em;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
