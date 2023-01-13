<template>
  <span :title="date.toLocaleString()">{{ relativeTime }}</span>
</template>

<script lang="ts" setup>
import { toRelativeTime } from "@/libs/relative-time";
import { useNow } from "@vueuse/core";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  date: Date | number | string;
}>();

const { locale } = useI18n();

const date = computed(() => new Date(props.date));

const now = useNow({ interval: 5000 });

const relativeTime = computed(() =>
  toRelativeTime(date.value, now.value, locale.value)
);
</script>

<style lang="postcss" scoped></style>
