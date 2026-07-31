<template>
  <VtsDeleteButton
    :disabled="!canDeleteTrafficRule"
    :busy="isDeletingTrafficRule"
    @click="deleteTrafficRules()"
  />
</template>

<script lang="ts" setup>
import { useTrafficRuleDelete } from '@/modules/traffic-rules/composables/use-traffic-rule-delete.composable.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import type { TrafficRule } from '@vates/types'

const { rule } = defineProps<{
  rule: TrafficRule
}>()

const {
  deleteTrafficRules,
  canRun: canDeleteTrafficRule,
  isRunning: isDeletingTrafficRule,
} = useTrafficRuleDelete(() => [rule])
</script>
