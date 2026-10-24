<template>
  <span class="vdf-rule-sentence typo-body-regular-small">
    <span class="typo-body-bold-small">{{ t('firewall:rule-number', { id: globalRuleId(rule.id) }) }}</span>
    <VdfActionTag :action="ruleAction(rule)" />
    <span>{{
      isEgressRule(rule) ? t('firewall:review:to', { destination: peer }) : t('firewall:review:from', { source: peer })
    }}</span>
    <span>{{ traffic }}</span>
  </span>
</template>

<script lang="ts" setup>
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import type { VdfRule } from '@/modules/vdf/types.ts'
import { displayName, globalRuleId } from '@/modules/vdf/utils/vdf-global.util.ts'
import { formatPorts, ruleAction } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { isEgressRule, rulePeer } from '@/modules/vdf/utils/vdf-rules.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// A rule as a sentence: `#12 Allow from app TCP 5432`, an egress rule
// `#13 Allow to db TCP 5432` (vdf#53)
const { rule } = defineProps<{
  rule: VdfRule
}>()

const { t } = useI18n()

const peer = computed(() => (rulePeer(rule) === 'any' ? t('firewall:any') : displayName(rulePeer(rule))))

const traffic = computed(() => {
  if (rule.proto === 'any') {
    return t('firewall:any-protocol')
  }

  const ports = formatPorts(rule.ports)

  return ports === ''
    ? rule.proto.toUpperCase()
    : t('firewall:review:protocol-ports', { protocol: rule.proto.toUpperCase(), ports })
})
</script>

<style lang="postcss" scoped>
.vdf-rule-sentence {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}
</style>
