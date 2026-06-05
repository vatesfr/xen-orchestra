<template>
  <TrafficRuleDeleteButton :rule />
</template>

<script lang="ts" setup>
import TrafficRuleDeleteButton from '@/modules/traffic-rules/components/actions/delete/TrafficRuleDeleteButton.vue'
import type { TrafficRule } from '@vates/types'

defineProps<{
  rule: TrafficRule
}>()
</script>
