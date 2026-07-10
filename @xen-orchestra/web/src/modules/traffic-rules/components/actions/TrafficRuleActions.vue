<template>
  <VtsDeleteButton
    :disabled="!canDeleteTrafficRule"
    :busy="isDeletingTrafficRule"
    @click="openTrafficRuleDeleteModal()"
  />
</template>

<script lang="ts" setup>
import { useTrafficRuleDeleteModal } from '@/modules/traffic-rules/composables/use-traffic-rule-delete-modal.composable.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import type { TrafficRule } from '@vates/types'

const { rule } = defineProps<{
  rule: TrafficRule
}>()

const {
  openModal: openTrafficRuleDeleteModal,
  canRun: canDeleteTrafficRule,
  isRunning: isDeletingTrafficRule,
} = useTrafficRuleDeleteModal(() => [rule])
</script>
