<template>
  <span :title="formattedDate">{{ relativeTime }}</span>
</template>

<script lang="ts" setup>
import useRelativeTime from '@core/composables/relative-time.composable.ts'
import { formatDateTime, parseDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'

const props = defineProps<{
  date: Date | number | string
}>()

const date = computed(() => new Date(parseDateTime(props.date)))

const formattedDate = computed(() => formatDateTime(date.value))

const relativeTime = useRelativeTime(date)
</script>
