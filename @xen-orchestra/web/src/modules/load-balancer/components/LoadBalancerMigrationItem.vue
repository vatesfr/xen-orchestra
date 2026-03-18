<template>
  <div class="load-balancer-migration-item">
    <div class="vm-info">
      <VtsIcon :name="objectIcon('vm', toLower(vm.power_state))" size="medium" />
      <div class="vm-details">
        <span class="vm-name typo-body-semi-bold">{{ vm.name_label }}</span>
        <span class="vm-memory typo-body-regular-small">{{ formatSize(vm.memory.size, 1) }}</span>
      </div>
    </div>
    <div class="migration-flow">
      <div class="host-badge from">
        <VtsIcon name="object:host" size="medium" />
        <span class="typo-body-regular-small">{{ currentHostName }}</span>
      </div>
      <VtsIcon name="fa:arrow-right" size="medium" class="arrow" />
      <div class="host-badge to">
        <VtsIcon name="object:host" size="medium" />
        <span class="typo-body-semi-bold">{{ targetHostName }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { objectIcon } from '@core/icons'
import { formatSize } from '@core/utils/size.util.ts'
import type { XoHost } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm, targetHostId, hosts } = defineProps<{
  vm: FrontXoVm
  targetHostId: XoHost['id']
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

const currentHostName = computed(() => {
  if (vm.$container === vm.$pool) {
    return t('load-balancer:no-host')
  }

  return hostMap.value.get(vm.$container as XoHost['id'])?.name_label ?? vm.$container
})

const targetHostName = computed(() => hostMap.value.get(targetHostId)?.name_label ?? String(targetHostId))
</script>

<style lang="postcss" scoped>
.load-balancer-migration-item {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.2rem 1.6rem;
  border-bottom: 1px solid var(--color-neutral-border);

  &:last-child {
    border-bottom: none;
  }

  .vm-info {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .vm-details {
    display: flex;
    align-items: baseline;
    gap: 0.8rem;
    flex: 1;
    min-width: 0;
  }

  .vm-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vm-memory {
    color: var(--color-neutral-txt-secondary);
    white-space: nowrap;
  }

  .migration-flow {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding-inline-start: 1.6rem;
  }

  .host-badge {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    border-radius: 0.4rem;

    &.from {
      background-color: var(--color-neutral-background-secondary);
      color: var(--color-neutral-txt-secondary);
    }

    &.to {
      background-color: var(--color-info-background-selected);
      color: var(--color-info-txt-base);
    }
  }

  .arrow {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
