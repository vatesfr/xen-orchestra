<template>
  <MenuItem
    :busy="isEditingTrafficRulesOrder"
    :disabled="!canEditTrafficRulesOrder"
    accent="neutral"
    icon="action:edit"
    @click="editTrafficRulesOrder()"
  >
    {{ t('action:edit-rules-order') }}
    <i v-if="isXapiPluginRequired" class="em-dash-prefix">
      <I18nT keypath="traffic-rules:xapi-plugin-required-with-link" scope="global">
        <template #xapi-plugin>
          <UiLink :href="XO_LINKS.DOC_SDN_CONTROLLER_XAPI_PLUGIN" size="small">
            {{ t('traffic-rules:xapi-plugin-required-with-link:xapi-plugin') }}
          </UiLink>
        </template>
      </I18nT>
    </i>
    <i v-else-if="editTrafficRulesOrderErrorMessage" class="em-dash-prefix">{{ editTrafficRulesOrderErrorMessage }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useTrafficRuleEditOrder } from '@/modules/traffic-rules/composables/use-traffic-rule-edit-order.composable.ts'
import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'
import { XO_LINKS } from '@/shared/constants.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { I18nT, useI18n } from 'vue-i18n'

const { rule, rules } = defineProps<{
  rule: RankedTrafficRule
  rules: RankedTrafficRule[]
}>()

const { t } = useI18n()

const {
  editTrafficRulesOrder,
  canEditTrafficRulesOrder,
  isEditingTrafficRulesOrder,
  editTrafficRulesOrderErrorMessage,
  isXapiPluginRequired,
} = useTrafficRuleEditOrder(
  () => rule.networkId,
  () => rules
)
</script>
