<template>
  <UiCard class="pool-dashboard-coming-soon">
    <UiCardTitle>{{ title }}</UiCardTitle>
    <div class="content">
      <img alt="Under construction" src="@/assets/under-construction.svg" />
    </div>
    <div class="content">Coming soon</div>
  </UiCard>
</template>

<script setup lang="ts">
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";

defineProps<{
  title: string;
}>();
</script>

<style scoped lang="postcss">
.pool-dashboard-coming-soon {
  display: flex;
  flex-direction: column;
}

.content {
  padding: 1rem 0;
  text-align: center;
}
</style>
