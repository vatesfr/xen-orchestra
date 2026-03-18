<template>
  <div class="load-balancer-affinity-group-item">
    <div class="header">
      <UiTag :accent="group.type === 'affinity' ? 'success' : 'danger'" variant="primary">
        {{ group.type === 'affinity' ? t('load-balancer:affinity') : t('load-balancer:anti-affinity') }}
      </UiTag>
      <span class="name typo-body-semi-bold">{{ group.name }}</span>
      <span class="count typo-body-regular-small">
        {{ t('load-balancer:n-vms', group.vms.length) }}
      </span>
    </div>
    <div class="vms">
      <div v-for="vm of group.vms" :key="vm.id" class="vm">
        <VtsIcon :name="objectIcon('vm', toLower(vm.power_state))" size="medium" />
        <span class="vm-name">{{ vm.name_label }}</span>
        <span class="vm-host typo-body-regular-small">{{ getHostName(vm) }}</span>
      </div>
    </div>
    <div v-if="group.type === 'anti-affinity' && hasConflict" class="conflict-warning">
      <VtsIcon name="fa:triangle-exclamation" size="medium" />
      {{ t('load-balancer:anti-affinity-conflict') }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { objectIcon } from '@core/icons'
import type { XoHost } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export interface AffinityGroup {
  name: string
  type: 'affinity' | 'anti-affinity'
  vms: FrontXoVm[]
}

const { group, hosts } = defineProps<{
  group: AffinityGroup
  hosts: FrontXoHost[]
}>()

const { t } = useI18n()

const hostMap = computed(() => {
  const map = new Map<XoHost['id'], FrontXoHost>()

  for (const host of hosts) {
    map.set(host.id, host)
  }

  return map
})

const hasConflict = computed(() => {
  const hostIds = new Set<string>()

  for (const vm of group.vms) {
    if (vm.$container !== vm.$pool) {
      hostIds.add(vm.$container)
    }
  }

  return hostIds.size < group.vms.length && group.vms.length > 1
})

function getHostName(vm: FrontXoVm): string {
  if (vm.$container === vm.$pool) {
    return t('load-balancer:no-host')
  }

  return hostMap.value.get(vm.$container as XoHost['id'])?.name_label ?? vm.$container
}
</script>

<style lang="postcss" scoped>
.load-balancer-affinity-group-item {
  padding: 1.6rem;
  border-bottom: 1px solid var(--color-neutral-border);

  &:last-child {
    border-bottom: none;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 1.2rem;
  }

  .name {
    flex: 1;
  }

  .count {
    color: var(--color-neutral-txt-secondary);
  }

  .vms {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-inline-start: 1.6rem;
  }

  .vm {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .vm-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vm-host {
    color: var(--color-neutral-txt-secondary);
  }

  .conflict-warning {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-top: 0.8rem;
    padding: 0.8rem;
    background-color: var(--color-warning-background-selected);
    color: var(--color-warning-txt-base);
    border-radius: 0.4rem;
  }
}
</style>
