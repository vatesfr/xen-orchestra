<template>
  <span v-if="group === 'any'" class="vdf-group-chip any typo-body-regular-small">
    <VtsIcon name="fa:earth-americas" size="small" />
    {{ t('firewall:any') }}
  </span>
  <RouterLink
    v-else
    v-tooltip="tooltip"
    class="vdf-group-chip typo-body-regular-small"
    :class="{ unknown: !exists, global: isGlobal }"
    :to="vdfPageRoute(scopeId, 'groups', { group })"
  >
    <VtsIcon :name="isGlobal ? 'fa:globe' : 'fa:object-group'" size="small" />
    {{ displayName(group) }}
    <span v-if="count !== undefined || ips" class="count">{{ (count ?? 0) + (ips ?? 0) }}</span>
  </RouterLink>
</template>

<script lang="ts" setup>
import type { VdfScopeId } from '@/modules/vdf/types.ts'
import { displayName, isGlobalName, vdfPageRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  group,
  count,
  ips,
  exists = true,
} = defineProps<{
  scopeId: VdfScopeId
  group: string
  // member VMs, and static IPs
  count?: number
  ips?: number
  exists?: boolean
}>()

const { t } = useI18n()

// a group of the global configuration, used in a pool
const isGlobal = computed(() => isGlobalName(group))

const tooltip = computed(() => {
  if (!exists) {
    return t('firewall:group:unknown')
  }

  const parts = isGlobal.value ? [t('firewall:global:group')] : []

  if (count !== undefined) {
    parts.push(t('firewall:group:members', { n: count }))
  }

  if (ips) {
    parts.push(t('firewall:group:ips', { n: ips }))
  }

  return parts.length === 0 ? false : parts.join(' · ')
})
</script>

<style lang="postcss" scoped>
.vdf-group-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.2rem 0.8rem;
  border-radius: 0.4rem;
  border: 0.1rem solid var(--color-brand-item-base);
  color: var(--color-brand-txt-base);
  background-color: var(--color-brand-background-selected);
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background-color: var(--color-brand-background-hover);
  }

  &.any {
    border-color: var(--color-neutral-border);
    color: var(--color-neutral-txt-primary);
    background-color: var(--color-neutral-background-secondary);
  }

  &.global {
    border-style: dashed;
  }

  &.unknown {
    border-color: var(--color-danger-item-base);
    color: var(--color-danger-txt-base);
    background-color: var(--color-danger-background-selected);
  }

  .count {
    padding: 0 0.6rem;
    border-radius: 1rem;
    color: var(--color-brand-txt-item);
    background-color: var(--color-brand-item-base);
    font-size: 1.2rem;
  }
}
</style>
