<template>
  <MenuItem
    :busy="isDeletingTrafficRules"
    :disabled="!canDeleteTrafficRules"
    accent="danger"
    icon="action:delete"
    @click="deleteTrafficRules()"
  >
    {{ t('action:delete') }}
    <i v-if="deleteTrafficRulesErrorMessage" class="em-dash-prefix">{{ deleteTrafficRulesErrorMessage }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useTrafficRuleDelete } from '@/modules/traffic-rules/composables/use-traffic-rule-delete.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { rule } = defineProps<{
  rule: TrafficRule
}>()

const { t } = useI18n()

const { deleteTrafficRules, canDeleteTrafficRules, isDeletingTrafficRules, deleteTrafficRulesErrorMessage } =
  useTrafficRuleDelete(() => [rule])
</script>
