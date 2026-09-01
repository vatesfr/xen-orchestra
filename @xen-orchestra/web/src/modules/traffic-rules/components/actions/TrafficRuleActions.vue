<template>
  <UiButton
    size="medium"
    variant="tertiary"
    accent="brand"
    left-icon="action:edit"
    :disabled="!canEditTrafficRule"
    :busy="isEditingTrafficRule"
    @click="editTrafficRule()"
  >
    {{ t('action:edit') }}
  </UiButton>
  <VtsDeleteButton :disabled="!canDeleteTrafficRules" :busy="isDeletingTrafficRules" @click="deleteTrafficRules()" />
</template>

<script lang="ts" setup>
import { useTrafficRuleDelete } from '@/modules/traffic-rules/composables/use-traffic-rule-delete.composable.ts'
import { useTrafficRuleEdit } from '@/modules/traffic-rules/composables/use-traffic-rule-edit.composable.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { rule } = defineProps<{
  rule: TrafficRule
}>()

const { t } = useI18n()

const { deleteTrafficRules, canDeleteTrafficRules, isDeletingTrafficRules } = useTrafficRuleDelete(() => [rule])

const { editTrafficRule, canEditTrafficRule, isEditingTrafficRule } = useTrafficRuleEdit(() => rule)
</script>
