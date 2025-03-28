<template>
  <span :title="date.toLocaleString()">{{ relativeTime }}</span>
</template>

<script lang="ts" setup>
import { parseDateTime } from '@/libs/utils'
import useRelativeTime from '@core/composables/relative-time.composable'
import { useNow } from '@vueuse/core'
import { computed } from 'vue'

const props = defineProps<{
  date: Date | number | string
}>()

const date = computed(() => new Date(parseDateTime(props.date)))
const now = useNow({ interval: 1000 })
const relativeTime = useRelativeTime(date, now)
</script>
