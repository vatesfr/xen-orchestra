<!-- Adapted from https://www.benmvp.com/blog/how-to-create-circle-svg-gradient-loading-spinner/ -->

<template>
  <svg
    class="ui-spinner"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 400"
    fill="none"
  >
    <defs>
      <linearGradient id="spinner-secondHalf">
        <stop offset="0%" stop-opacity="0" stop-color="currentColor" />
        <stop offset="100%" stop-opacity="0.5" stop-color="currentColor" />
      </linearGradient>
      <linearGradient id="spinner-firstHalf">
        <stop offset="0%" stop-opacity="1" stop-color="currentColor" />
        <stop offset="100%" stop-opacity="0.5" stop-color="currentColor" />
      </linearGradient>
    </defs>

    <g stroke-width="40">
      <path
        d="M 30 200 A 170 170 180 0 1 370 200"
        stroke="url(#spinner-secondHalf)"
      />
      <path
        d="M 370 200 A 170 170 0 0 1 30 200"
        stroke="url(#spinner-firstHalf)"
      />
      <path
        stroke="currentColor"
        stroke-linecap="round"
        d="M 30 200 A 170 170 180 0 1 30 200"
      />
    </g>
  </svg>
</template>

<style lang="postcss" scoped>
.ui-spinner {
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
