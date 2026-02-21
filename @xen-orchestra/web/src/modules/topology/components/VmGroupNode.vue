<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype: i18n keys to be added later -->
<template>
  <div class="topology-node vm-group-node" :class="isLR ? 'dir-lr' : 'dir-tb'">
    <Handle type="target" :position="isLR ? Position.Left : Position.Top" />
    <div class="vm-header">
      <span class="icon-circle">
        <FontAwesomeIcon :icon="faDesktop" class="vm-icon" />
      </span>
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
    <NodeExpandButton v-if="data.isExpandable" :expanded="data.isExpanded" @toggle="toggleExpand?.(id)" />
  </div>
</template>

<script lang="ts" setup>
import NodeExpandButton from '@/modules/topology/components/NodeExpandButton.vue'
import { TOPOLOGY_DIRECTION, TOPOLOGY_TOGGLE_EXPAND } from '@/modules/topology/composables/use-topology-interaction.ts'
import type { VmGroupNodeData } from '@/modules/topology/types/topology.types.ts'
import { faDesktop } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Handle, Position } from '@vue-flow/core'
import { inject } from 'vue'

defineProps<{ data: VmGroupNodeData; id: string }>()

const toggleExpand = inject(TOPOLOGY_TOGGLE_EXPAND, undefined)
const isLR = inject(TOPOLOGY_DIRECTION, 'TB') === 'LR'
</script>

<style scoped lang="postcss">
.vm-group-node {
  background: var(--color-neutral-background-secondary);
  border: 0.1rem dashed var(--color-neutral-border);
  border-radius: 0.6rem;
  padding: 0.8rem 1.2rem;
  min-width: 18rem;

  &.dir-tb {
    padding-bottom: 2rem;
  }

  &.dir-lr {
    padding-right: 2.5rem;
  }
  max-width: 26rem;
  overflow: visible;
  position: relative;
  box-shadow: var(--shadow-200);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    box-shadow: var(--shadow-300);
    transform: translateY(-0.2rem);
  }

  :root.dark & {
    box-shadow: 0 0.2rem 0.8rem rgba(255, 255, 255, 0.06);

    &:hover {
      box-shadow: 0 0.4rem 1.4rem rgba(255, 255, 255, 0.1);
    }
  }

  .vm-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .icon-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    background: var(--color-neutral-background-disabled);
    flex-shrink: 0;

    :root.dark & {
      background: color-mix(in srgb, var(--color-neutral-txt-secondary) 15%, transparent);
    }

    .vm-icon {
      color: var(--color-neutral-txt-secondary);
      font-size: 1rem;
    }
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
    min-width: 0;

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
