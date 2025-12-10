<template>
  <span :title="date.toLocaleString()">{{ relativeTime }}</span>
</template>

<script lang="ts" setup>
import useRelativeTime from '@core/composables/relative-time.composable'
import { parseDateTime } from '@core/utils/time.util'
import { computed } from 'vue'

const props = defineProps<{
  date: Date | number | string
}>()

const date = computed(() => new Date(parseDateTime(props.date)))

const relativeTime = useRelativeTime(date)
</script>
