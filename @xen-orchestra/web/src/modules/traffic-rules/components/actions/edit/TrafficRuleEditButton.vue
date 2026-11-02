<template>
  <MenuItem
    :busy="isEditingTrafficRule"
    :disabled="!canEditTrafficRule"
    accent="neutral"
    icon="action:edit"
    @click="editTrafficRule()"
  >
    {{ t('action:edit') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useTrafficRuleEdit } from '@/modules/traffic-rules/composables/use-traffic-rule-edit.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { rule } = defineProps<{
  rule: TrafficRule
}>()

const { t } = useI18n()

const { editTrafficRule, canEditTrafficRule, isEditingTrafficRule } = useTrafficRuleEdit(() => rule)
</script>
