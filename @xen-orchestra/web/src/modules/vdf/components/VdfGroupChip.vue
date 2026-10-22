<template>
  <span v-if="group === 'any'" class="vdf-group-chip any typo-body-regular-small">
    <VtsIcon name="fa:earth-americas" size="small" />
    {{ t('firewall:any') }}
  </span>
  <RouterLink
    v-else
    v-tooltip="tooltip"
    class="vdf-group-chip typo-body-regular-small"
    :class="{ unknown: !exists }"
    :to="{ name: '/pool/[id]/firewall/groups', params: { id: poolId }, query: { group } }"
  >
    <VtsIcon name="fa:object-group" size="small" />
    {{ group }}
    <span v-if="count !== undefined || ips" class="count">{{ (count ?? 0) + (ips ?? 0) }}</span>
  </RouterLink>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  count,
  ips,
  exists = true,
} = defineProps<{
  poolId: string
  group: string
  // member VMs, and static IPs
  count?: number
  ips?: number
  exists?: boolean
}>()

const { t } = useI18n()

const tooltip = computed(() => {
  if (!exists) {
    return t('firewall:group:unknown')
  }

  const parts = []

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
