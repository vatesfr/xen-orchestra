<template>
  <div>
    <img alt="Not found" src="../assets/not-found.svg" />
    <p class="numeric">404</p>
    <p class="text">This page is not to be found...</p>
    <UiButton>Go back to your Pool dashboard</UiButton>
  </div>
</template>

<script setup lang="ts">
import UiButton from "@/components/ui/UiButton.vue";
</script>

<style lang="postcss" scoped>
div {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
img {
  width: 30%;
}
.numeric {
  color: var(--color-extra-blue-base);
  font-size: 96px;
  font-weight: 900;
  letter-spacing: 1em;
  line-height: 100%;
  margin-right: -1em;
  text-align: center;
}

.text {
  color: var(--color-extra-blue-base);
  font-size: 36px;
  font-weight: 400;
  line-height: 150%;
  margin: 0.5em;
  text-align: center;
}
</style>
