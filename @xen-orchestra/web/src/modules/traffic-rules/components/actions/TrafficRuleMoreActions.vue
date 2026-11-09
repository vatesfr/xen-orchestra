<template>
  <TrafficRuleEditButton :rule />
  <TrafficRuleEditOrderButton v-if="showEditOrder" :rule :rules />
</template>

<script lang="ts" setup>
import TrafficRuleEditButton from '@/modules/traffic-rules/components/actions/edit/TrafficRuleEditButton.vue'
import TrafficRuleEditOrderButton from '@/modules/traffic-rules/components/actions/edit-order/TrafficRuleEditOrderButton.vue'
import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'

defineProps<{
  rule: RankedTrafficRule
  rules: RankedTrafficRule[]
  showEditOrder?: boolean
}>()
</script>
