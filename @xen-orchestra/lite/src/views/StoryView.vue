<template>
  <TitleBar :icon="faBook">
    {{ title }}
  </TitleBar>
  <RouterView />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import TitleBar from "@/components/TitleBar.vue";

const { currentRoute } = useRouter();

const title = computed(() => {
  if (!currentRoute.value.meta.isStory) {
    return "Components Stories";
  }

  return `${currentRoute.value.meta.storyTitle} Story`;
});
</script>

<style lang="postcss" scoped></style>
