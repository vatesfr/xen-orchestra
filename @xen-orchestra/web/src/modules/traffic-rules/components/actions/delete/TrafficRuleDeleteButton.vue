<template>
  <VtsDeleteButton
    :hint="deleteTrafficRulesErrorMessage"
    :disabled="!canDeleteTrafficRules"
    :busy="isDeletingTrafficRules"
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

const { deleteTrafficRules, canDeleteTrafficRules, isDeletingTrafficRules, deleteTrafficRulesErrorMessage } =
  useTrafficRuleDelete(() => [rule])
</script>
