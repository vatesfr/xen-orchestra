<template>
  <UiCard class="host-load-card">
    <UiCardTitle>
      {{ host.name_label }}
      <UiCounter :value="parsedVms.length" accent="neutral" size="small" variant="primary" />
    </UiCardTitle>
    <VtsStateHero
      v-if="parsedVms.length === 0 && !incomingVms?.length"
      format="card"
      horizontal
      size="extra-small"
      type="no-data"
    />
    <ul v-else class="vm-list">
      <li v-for="vm in parsedVms" :key="vm.id" class="vm-item" :class="{ 'will-migrate': vm.willMigrate }">
        <span class="vm-name typo-body-regular-small">{{ vm.name_label }}</span>
        <UiTagsList v-if="vm.tags.length > 0">
          <VtsTag v-for="tag in vm.tags" :key="tag" :tag="tag" />
        </UiTagsList>
      </li>
      <li v-for="vm in incomingVms" :key="vm.id" class="vm-item will-arrive">
        <span class="vm-name typo-body-regular-small">{{ vm.name_label }}</span>
        <UiTagsList v-if="vm.tags.length > 0">
          <VtsTag v-for="tag in vm.tags" :key="tag" :tag="tag" />
        </UiTagsList>
      </li>
    </ul>
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import type { XoHost, XoVm } from '@vates/types'
import { computed } from 'vue'

const { host, vms, incomingVms, simulationResult } = defineProps<{
  host: FrontXoHost
  vms: FrontXoVm[]
  incomingVms?: FrontXoVm[]
  simulationResult?: Record<XoVm['id'], XoHost['id']>
}>()

const parsedVms = computed(() =>
  vms.map(vm => {
    const targetHostId = simulationResult?.[vm.id]

    return {
      id: vm.id,
      name_label: vm.name_label,
      tags: vm.tags,
      willMigrate: targetHostId !== undefined && targetHostId !== host.id,
    }
  })
)
</script>

<style lang="postcss" scoped>
.host-load-card {
  .vm-list {
    display: flex;
    flex-direction: column;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .vm-item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--color-neutral-border);

    &:first-child {
      padding-top: 0;
    }

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    &.will-migrate {
      opacity: 0.5;
      text-decoration: line-through;
    }

    &.will-arrive {
      color: var(--color-success-txt-base);
    }
  }

  .vm-name {
    overflow-wrap: break-word;
    word-break: break-word;
  }
}
</style>
