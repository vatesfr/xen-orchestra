<template>
  <VtsRow class="vdf-no-match-row" :class="{ removed }">
    <UiTableCell class="cell" />
    <UiTableCell class="cell" :colspan="columns - 1">
      <span class="content typo-body-regular-small">
        <span class="label">{{ t('firewall:no-rule-matches') }}</span>
        <VdfActionTag :action="policy.default" is-default />
        <span v-if="policy.logDefault" class="label">
          <VtsIcon name="fa:list" size="small" />
          {{ t('firewall:logged') }}
        </span>
      </span>
    </UiTableCell>
  </VtsRow>
</template>

<script lang="ts" setup>
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import type { VdfPolicy } from '@/modules/vdf/types.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { useI18n } from 'vue-i18n'

// Closes a policy's rules: not a rule (no number, can't move), what the
// policy does with what none of them matched
defineProps<{
  policy: VdfPolicy
  columns: number
  removed: boolean
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vdf-no-match-row {
  .cell {
    padding-block: 0.3rem;
  }

  &.removed .content {
    opacity: 0.5;
  }

  .content {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }

  .label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-style: italic;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
