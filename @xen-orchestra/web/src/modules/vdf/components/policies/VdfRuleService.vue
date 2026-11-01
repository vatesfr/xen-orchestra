<template>
  <span class="vdf-rule-service">
    <UiTag accent="neutral" variant="secondary">{{ protocol }}</UiTag>
    <span v-if="ports !== ''" class="ports">{{ ports }}</span>
    <span v-else-if="hasPorts" class="all-ports typo-body-regular-small">{{ t('firewall:all-ports') }}</span>
  </span>
</template>

<script lang="ts" setup>
import type { VdfRule } from '@/modules/vdf/types.ts'
import { formatPorts } from '@/modules/vdf/utils/vdf-policy.util.ts'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// What a rule admits: "TCP 80, 443", "UDP all ports", "ICMP"
const { rule } = defineProps<{
  rule: VdfRule
}>()

const { t } = useI18n()

const protocol = computed(() => (rule.proto === 'any' ? t('firewall:any-protocol') : rule.proto.toUpperCase()))

const ports = computed(() => formatPorts(rule.ports))

const hasPorts = computed(() => rule.proto === 'tcp' || rule.proto === 'udp')
</script>

<style lang="postcss" scoped>
.vdf-rule-service {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  white-space: nowrap;

  .ports {
    font-variant-numeric: tabular-nums;
  }

  .all-ports {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
