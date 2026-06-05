<template>
  <MenuItem
    icon="action:delete"
    :disabled="!canDeleteTrafficRule"
    :busy="isDeletingTrafficRule"
    class="delete"
    @click="openTrafficRuleDeleteModal()"
  >
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useTrafficRuleDeleteModal } from '@/modules/traffic-rules/composables/use-traffic-rule-delete-modal.composable.ts'
import type { TrafficRule } from '@vates/types'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
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
</script>

<style lang="postcss" scoped>
.delete {
  color: var(--color-danger-item-base);
}
</style>
