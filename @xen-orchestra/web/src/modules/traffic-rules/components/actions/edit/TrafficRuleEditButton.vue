<template>
  <VtsActionButton
    :hint="editTrafficRuleErrorMessage"
    variant="tertiary"
    accent="brand"
    icon="action:edit"
    :disabled="!canEditTrafficRule"
    :busy="isEditingTrafficRule"
    @click="editTrafficRule()"
  >
    {{ t('action:edit') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useTrafficRuleEdit } from '@/modules/traffic-rules/composables/use-traffic-rule-edit.composable.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { rule } = defineProps<{
  rule: TrafficRule
}>()

const { t } = useI18n()

const { editTrafficRule, canEditTrafficRule, isEditingTrafficRule, editTrafficRuleErrorMessage } = useTrafficRuleEdit(
  () => rule
)
</script>
