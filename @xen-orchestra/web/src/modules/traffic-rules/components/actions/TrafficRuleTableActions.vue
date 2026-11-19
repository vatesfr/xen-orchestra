<template>
  <TrafficRuleMoreActions :rule :rules :show-edit-order />
  <TrafficRuleDeleteButton :rule />
</template>

<script lang="ts" setup>
import TrafficRuleDeleteButton from '@/modules/traffic-rules/components/actions/delete/TrafficRuleDeleteButton.vue'
import TrafficRuleMoreActions from '@/modules/traffic-rules/components/actions/TrafficRuleMoreActions.vue'
import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'

defineProps<{
  rule: RankedTrafficRule
  rules: RankedTrafficRule[]
  showEditOrder?: boolean
}>()
</script>
