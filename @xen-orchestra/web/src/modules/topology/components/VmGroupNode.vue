<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype: i18n keys to be added later -->
<template>
  <div class="topology-node vm-group-node">
    <Handle type="target" :position="Position.Top" />
    <div class="vm-header">
      <FontAwesomeIcon :icon="faDesktop" class="vm-icon" />
      <div class="vm-summary">
        <span v-if="data.runningCount > 0" class="count running">{{ data.runningCount }} running</span>
        <span v-if="data.stoppedCount > 0" class="count stopped">{{ data.stoppedCount }} stopped</span>
        <span class="total">{{ data.vms.length }} VMs</span>
      </div>
    </div>
    <div v-if="data.isExpanded" class="vm-list">
      <div v-for="vm in data.vms" :key="vm.id" class="vm-row">
        <span class="vm-dot" :class="vm.power_state === 'Running' ? 'running' : 'halted'" />
        <RouterLink :to="{ name: '/vm/[id]', params: { id: vm.id } }" class="vm-name">
          {{ vm.name_label }}
        </RouterLink>
      </div>
    </div>
    <NodeExpandButton
      v-if="data.isExpandable"
      :expanded="data.isExpanded"
      @toggle="toggleExpand?.(id)"
    />
  </div>
</template>

<script lang="ts" setup>
import NodeExpandButton from '@/modules/topology/components/NodeExpandButton.vue'
import { TOPOLOGY_TOGGLE_EXPAND } from '@/modules/topology/composables/use-topology-interaction.ts'
import type { VmGroupNodeData } from '@/modules/topology/types/topology.types.ts'
import { faDesktop } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Handle, Position } from '@vue-flow/core'
import { inject } from 'vue'

defineProps<{ data: VmGroupNodeData; id: string }>()

const toggleExpand = inject(TOPOLOGY_TOGGLE_EXPAND, undefined)
</script>

<style lang="postcss" scoped>
.vm-group-node {
  background: var(--color-neutral-background-secondary);
  border: 0.1rem dashed var(--color-neutral-border);
  border-radius: 0.6rem;
  padding: 0.8rem 1.2rem;
  padding-bottom: 2rem;
  min-width: 18rem;
  position: relative;

  .vm-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .vm-icon {
    color: var(--color-neutral-txt-secondary);
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  .vm-summary {
    display: flex;
    gap: 0.6rem;
    font-size: 1.1rem;
    align-items: center;

    .count {
      font-weight: 600;

      &.running {
        color: var(--color-success-item-base);
      }

      &.stopped {
        color: var(--color-danger-txt-base);
      }
    }

    .total {
      color: var(--color-neutral-txt-secondary);
    }
  }

  .vm-list {
    margin-top: 0.6rem;
    border-top: 0.1rem solid var(--color-neutral-border);
    padding-top: 0.4rem;
    display: flex;
    flex-direction: column;
  }

  .vm-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.3rem 0;

    .vm-dot {
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 50%;
      flex-shrink: 0;

      &.running {
        background: var(--color-success-item-base);
      }

      &.halted {
        background: var(--color-danger-item-base);
      }
    }

    .vm-name {
      font-size: 1.1rem;
      color: var(--color-neutral-txt-primary);
      text-decoration: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &:hover {
        color: var(--color-brand-item-hover);
      }
    }
  }
}
</style>
