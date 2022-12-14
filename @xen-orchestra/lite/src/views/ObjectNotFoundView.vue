<template>
  <div>
    <img alt="Not found" src="../assets/object-not-found.svg" />
    <p class="text">{{ $t("object-not-found", { id }) }}</p>
    <UiButton @click="router.push({ name: 'home' })">{{
      $t("back-pool-dashboard")
    }}</UiButton>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import UiButton from "@/components/ui/UiButton.vue";

defineProps<{
  id: string;
}>();

const router = useRouter();
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

.text {
  color: var(--color-extra-blue-base);
  font-size: 36px;
  font-weight: 400;
  line-height: 150%;
  margin: 0.5em;
  text-align: center;
}
</style>
