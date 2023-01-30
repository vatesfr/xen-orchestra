<template>
  <span :title="date.toLocaleString()">{{ relativeTime }}</span>
</template>

<script lang="ts" setup>
import useRelativeTime from "@/composables/relative-time.composable";
import { useNow } from "@vueuse/core";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    date: Date | number | string;
    interval?: number;
  }>(),
  { interval: 1000 }
);

const date = computed(() => new Date(props.date));
const now = useNow({ interval: props.interval });
const relativeTime = useRelativeTime(date, now);
</script>

<style lang="postcss" scoped></style>
