<template>
  <VtsRow class="vdf-no-match-row" :class="{ removed }">
    <UiTableCell class="cell" />
    <UiTableCell class="cell" :colspan="columns - 1">
      <span class="content typo-body-regular-small">
        <VtsIcon v-if="egress" name="fa:arrow-right-from-bracket" size="small" class="label" />
        <span class="label">{{ egress ? t('firewall:no-egress-rule-matches') : t('firewall:no-rule-matches') }}</span>
        <VdfActionTag :action is-default />
        <!-- only a default drop logs -->
        <span v-if="policy.logDefault && action === 'drop'" class="label">
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Closes a policy's rules: not a rule (no number, can't move), what the
// policy does with what none of them matched (egress: of its outbound
// rules, vdf#53)
const { policy, egress } = defineProps<{
  policy: VdfPolicy
  columns: number
  removed: boolean
  egress?: boolean
}>()

const action = computed(() => (egress ? (policy.egressDefault ?? 'pass') : policy.default))

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
