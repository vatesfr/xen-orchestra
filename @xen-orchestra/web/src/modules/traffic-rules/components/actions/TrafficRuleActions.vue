<template>
  <VtsDeleteButton
    :disabled="!canDeleteTrafficRule"
    :busy="isDeletingTrafficRule"
    @click="openTrafficRuleDeleteModal()"
  />
  <UiButton
    size="medium"
    variant="tertiary"
    accent="brand"
    left-icon="action:edit"
    @click="openUpdateTrafficRuleDrawer()"
  >
    {{ t('action:edit') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useTrafficRuleDeleteModal } from '@/modules/traffic-rules/composables/use-traffic-rule-delete-modal.composable.ts'
import { useTrafficRulesEditDrawer } from '@/modules/traffic-rules/composables/use-traffic-rule-edit-drawer.composable.js'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { rule } = defineProps<{
  rule: TrafficRule
}>()

const { t } = useI18n()

const {
  openModal: openTrafficRuleDeleteModal,
  canRun: canDeleteTrafficRule,
  isRunning: isDeletingTrafficRule,
} = useTrafficRuleDeleteModal(() => [rule])

const { openDrawer: openUpdateTrafficRuleDrawer } = useTrafficRulesEditDrawer(() => rule)
</script>
