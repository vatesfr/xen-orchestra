<template>
  <RouterLink :to="{ name: 'story' }">
    <UiTitle type="h4">Stories</UiTitle>
  </RouterLink>
  <ul class="links">
    <li v-for="route in routes" :key="route.name">
      <RouterLink class="link" :to="route">
        {{ route.meta.storyTitle }}
      </RouterLink>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import UiTitle from "@/components/ui/UiTitle.vue";

const { getRoutes } = useRouter();

const routes = getRoutes().filter((route) => route.meta.isStory);
</script>

<style lang="postcss" scoped>
.links {
  padding: 1rem;
}
.link {
  display: inline-block;
  padding: 0.5rem 1rem;
  text-decoration: none;
  font-size: 1.6rem;
}
</style>
