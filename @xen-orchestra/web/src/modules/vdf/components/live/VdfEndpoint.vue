<template>
  <span class="vdf-endpoint">
    <span v-if="vm || name || groups?.length" class="names">
      <UiLink v-if="vm" size="small" :icon="vmIcon" :to="{ name: '/vm/[id]/firewall', params: { id: vm.id } }">
        {{ vm.name_label }}
      </UiLink>
      <span v-else-if="name" class="typo-body-bold-small">{{ name }}</span>
      <VdfGroupChip v-for="group of groups" :key="group" :scope-id :group />
    </span>
    <code v-if="ip" class="ip" :class="{ secondary: vm || name || groups?.length }">{{ ip }}</code>
    <span v-if="iface" class="secondary typo-body-regular-small">{{ iface }}</span>
  </span>
</template>

<script lang="ts" setup>
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import type { VdfScopeId } from '@/modules/vdf/types.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import { toLower } from 'lodash-es'
import { computed } from 'vue'

// One end of a connection: the VM it belongs to (or the name the agent
// gave) and the groups listing it as a static member, over the address
const { vm } = defineProps<{
  scopeId: VdfScopeId
  ip: string
  vm?: FrontXoVm
  name?: string
  groups?: string[]
  // which interface, for a VM with several (vdf#36): "eth1 · Backend"
  iface?: string
}>()

const vmIcon = computed(() => (vm === undefined ? undefined : objectIcon('vm', toLower(vm.power_state))))
</script>

<style lang="postcss" scoped>
.vdf-endpoint {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  max-width: 22rem;

  .names {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.6rem;
    max-width: 100%;
  }

  .ip {
    overflow-wrap: anywhere;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}

/* in a table on a laptop: the groups over two lines, not a sideways scroll */
@container vdf-table (max-width: 100rem) {
  .vdf-endpoint {
    max-width: 15rem;
  }
}
</style>
