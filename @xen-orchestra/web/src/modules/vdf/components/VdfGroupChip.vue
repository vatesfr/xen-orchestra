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
    :aria-label="ariaLabel"
    :to="vdfPageRoute(scopeId, 'groups', { group })"
  >
    <VtsIcon :name="icon" size="small" />
    <span class="name">{{ displayName(group) }}</span>
    <!-- in a pool, a global group next to the pool's own of the same name -->
    <span v-if="isGlobalName(group) && !isGlobalScope(scopeId)" class="global-mark">
      {{ t('firewall:global:mark') }}
    </span>
    <span v-if="networks.length > 0" class="networks">
      <VtsIcon name="fa:network-wired" size="small" />
      {{ networks.map(networkTagLabel).join(', ') }}
    </span>
    <UiCounter
      v-if="count !== undefined || ips"
      :value="(count ?? 0) + (ips ?? 0)"
      accent="neutral"
      variant="secondary"
      size="small"
      aria-hidden="true"
    />
  </RouterLink>
</template>

<script lang="ts" setup>
import { useVdfGroup } from '@/modules/vdf/composables/vdf-groups-context.composable.ts'
import type { VdfScopeId } from '@/modules/vdf/types.ts'
import { displayName, isGlobalName, isGlobalScope, vdfPageRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import { groupNetworks, networkTagLabel } from '@/modules/vdf/utils/vdf-networks.util.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  scopeId,
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

const { t, locale } = useI18n()

// a group scoped to networks (vdf#36) shows them: only its VMs'
// interfaces there
const groupDefinition = useVdfGroup(() => group)

const networks = computed(() => groupNetworks(groupDefinition.value))

// a group of the global configuration: in a pool (`global:` name) or on
// the global firewall's pages. It looks the same in both.
const isGlobal = computed(() => isGlobalName(group) || isGlobalScope(scopeId))

const icon = computed<IconName>(() => {
  if (!exists) {
    return 'status:warning'
  }

  return isGlobal.value ? 'fa:globe' : 'fa:object-group'
})

const details = computed(() => {
  if (!exists) {
    return [t('firewall:group:unknown')]
  }

  const parts = isGlobal.value ? [t('firewall:global:group')] : []

  if (networks.value.length > 0) {
    parts.push(t('firewall:group:networks', { networks: networks.value.join(', ') }))
  }

  if (count !== undefined) {
    parts.push(t('firewall:group:members', { n: count }))
  }

  if (ips) {
    parts.push(t('firewall:group:ips', { n: ips }))
  }

  return parts
})

const tooltip = computed(() => (details.value.length === 0 ? false : details.value.join('\n')))

const ariaLabel = computed(() =>
  details.value.length === 0
    ? displayName(group)
    : t('firewall:group-chip:label', {
        name: displayName(group),
        details: new Intl.ListFormat(locale.value, { type: 'unit' }).format(details.value),
      })
)
</script>

<style lang="postcss" scoped>
.vdf-group-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  max-width: 100%;
  padding: 0.1rem 0.6rem;
  border-radius: 0.4rem;
  border: 0.1rem solid var(--color-neutral-border);
  color: var(--color-neutral-txt-primary);
  text-decoration: none;
  white-space: nowrap;

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .global-mark {
    color: var(--color-neutral-txt-secondary);
  }

  .networks {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding-inline-start: 0.6rem;
    border-inline-start: 0.1rem solid var(--color-neutral-border);
    color: var(--color-neutral-txt-secondary);
  }

  &:is(a):hover {
    border-color: var(--color-brand-item-base);
    color: var(--color-brand-txt-base);
    background-color: var(--color-brand-background-hover);
  }

  &:focus-visible {
    outline: none;

    &::before {
      content: '';
      position: absolute;
      inset: -0.3rem;
      border: 0.2rem solid var(--color-brand-txt-base);
      border-radius: 0.6rem;
    }
  }

  &.global {
    border-style: dashed;
  }

  &.unknown {
    border-color: var(--color-danger-item-base);
    color: var(--color-danger-txt-base);
  }
}
</style>
