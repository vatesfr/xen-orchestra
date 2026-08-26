<template>
  <UiButton
    size="medium"
    variant="tertiary"
    accent="brand"
    left-icon="action:edit"
    :disabled="!canEditTrafficRule"
    :busy="isEditingTrafficRule"
    @click="openTrafficRuleEditDrawer()"
  >
    {{ t('action:edit') }}
  </UiButton>
  <VtsDeleteButton :disabled="!canDeleteTrafficRules" :busy="isDeletingTrafficRules" @click="deleteTrafficRules()" />
</template>

<script lang="ts" setup>
import { useTrafficRuleDelete } from '@/modules/traffic-rules/composables/use-traffic-rule-delete.composable.ts'
import { useTrafficRuleDeleteModal } from '@/modules/traffic-rules/composables/use-traffic-rule-delete-modal.composable.ts'
import { useTrafficRuleEditDrawer } from '@/modules/traffic-rules/composables/use-traffic-rule-edit-drawer.composable.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { rule } = defineProps<{
  rule: TrafficRule
}>()


const { deleteTrafficRules, canDeleteTrafficRules, isDeletingTrafficRules } = useTrafficRuleDelete(() => [rule])


const {
  openModal: openTrafficRuleDeleteModal,
  canRun: canDeleteTrafficRule,
  isRunning: isDeletingTrafficRule,
} = useTrafficRuleDeleteModal(() => [rule])

const {
  openDrawer: openTrafficRuleEditDrawer,
  isRunning: isEditingTrafficRule,
  canRun: canEditTrafficRule,
} = useTrafficRuleEditDrawer(() => rule)
</script>
