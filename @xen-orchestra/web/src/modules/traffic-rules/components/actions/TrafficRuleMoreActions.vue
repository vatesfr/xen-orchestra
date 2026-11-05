<template>
  <TrafficRuleEditButton :rule />
  <TrafficRuleEditOrderButton v-if="showEditOrder" :rule :rules />
  <TrafficRuleDeleteButton :rule />
</template>

<script lang="ts" setup>
import TrafficRuleDeleteButton from '@/modules/traffic-rules/components/actions/TrafficRuleDeleteButton.vue'
import TrafficRuleEditButton from '@/modules/traffic-rules/components/actions/TrafficRuleEditButton.vue'
import TrafficRuleEditOrderButton from '@/modules/traffic-rules/components/actions/TrafficRuleEditOrderButton.vue'
import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'

defineProps<{
  rule: RankedTrafficRule
  rules: RankedTrafficRule[]
  showEditOrder?: boolean
}>()
</script>
