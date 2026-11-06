<template>
  <span v-tooltip="compactTooltip" class="vdf-endpoint">
    <UiLink v-if="vm" size="small" :icon="vmIcon" :to="{ name: '/vm/[id]/firewall', params: { id: vm.id } }">
      {{ vm.name_label }}
    </UiLink>
    <span v-else-if="name" class="name typo-body-bold-small">{{ name }}</span>
    <VdfGroupChip v-if="firstGroup !== undefined" :scope-id :group="firstGroup" />
    <template v-if="!isCompacted">
      <span v-if="moreGroups.length > 0" v-tooltip="moreGroupsText" class="secondary typo-body-regular-small">
        {{ t('firewall:more', { n: moreGroups.length }) }}
      </span>
      <code v-if="ip" v-tooltip="addressTooltip" class="ip" :class="{ secondary: isNamed }">{{ shortIp }}</code>
      <span v-if="device" class="secondary typo-body-regular-small">{{ device }}</span>
    </template>
  </span>
</template>

<script lang="ts" setup>
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import type { VdfScopeId } from '@/modules/vdf/types.ts'
import { displayName } from '@/modules/vdf/utils/vdf-global.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { objectIcon } from '@core/icons'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// One end of a connection, on one line so that a table's rows stay one
// line high: the VM it belongs to (or the name the agent gave), the first
// group listing it as a static member (+N, the others on hover), then the
// address. A long IPv6 address keeps its start and end, whole on hover,
// with the interface's network.
// Compact (a narrow table): a named end shows its name or first group
// only; its address, interface and other groups on hover.
const {
  vm,
  name,
  ip,
  groups = [],
  iface,
  compact = false,
} = defineProps<{
  scopeId: VdfScopeId
  ip: string
  vm?: FrontXoVm
  name?: string
  groups?: string[]
  // which interface, for a VM with several (vdf#36): "eth1 · Backend"
  iface?: string
  compact?: boolean
}>()

const { t } = useI18n()

const vmIcon = computed(() => (vm === undefined ? undefined : objectIcon('vm', toLower(vm.power_state))))

const firstGroup = computed(() => groups[0])

// a pool's group and the global one of the same name read as one
const moreGroups = computed(() => {
  const first = firstGroup.value === undefined ? undefined : displayName(firstGroup.value)

  return [...new Set(groups.slice(1).map(displayName))].filter(group => group !== first)
})

const moreGroupsText = computed(() => moreGroups.value.join(', '))

const isNamed = computed(() => vm !== undefined || Boolean(name) || groups.length > 0)

const isCompacted = computed(() => compact && isNamed.value)

// 2a01:cb15:81d2:9e00:8886:e1ff:fe68:576f -> 2a01:…:fe68:576f: the
// prefix's start and the interface's end, where hosts differ
const shortIp = computed(() => {
  const parts = ip.split(':')

  return ip.length > 20 && parts.length > 4 ? `${parts[0]}:…:${parts.slice(-2).join(':')}` : ip
})

// "eth1 · Backend": the device in the row, its network on hover
const device = computed(() => iface?.split(' · ')[0])

const addressTooltip = computed(() => {
  const whole = [shortIp.value === ip ? undefined : ip, iface].filter(Boolean).join(' · ')

  return whole === '' ? false : whole
})

const compactTooltip = computed(() => {
  if (!isCompacted.value) {
    return false
  }

  const whole = [ip, iface, moreGroupsText.value].filter(Boolean).join(' · ')

  return whole === '' ? false : whole
})
</script>

<style lang="postcss" scoped>
.vdf-endpoint {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  white-space: nowrap;

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 16rem;
  }

  .ip {
    font-size: 0.875em;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
