<template>
  <TreeItem :expanded="pool.isExpanded">
    <TreeItemLabel :icon="faCity" :route="`/pool/${pool.id}`" @toggle="pool.toggleExpand()">
      {{ pool.label }}
    </TreeItemLabel>
    <template #sublist>
      <TreeList>
        <InfraHostList :hosts />
        <InfraVmList :vms />
      </TreeList>
    </template>
  </TreeItem>
</template>

<script lang="ts" setup>
import InfraHostList from '@/components/infra/InfraHostList.vue'
import InfraVmList from '@/components/infra/InfraVmList.vue'
import type { Host } from '@/types/host.type'
import type { Pool } from '@/types/pool.type'
import type { Vm } from '@/types/vm.type'
import type { Branch } from '@core/composables/tree/branch'
import type { Leaf } from '@core/composables/tree/leaf'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  pool: Branch<Pool, Branch<Host, Leaf<Vm>, 'host'> | Leaf<Vm, 'vm'>>
}>()

const hosts = computed(
  () => props.pool.children.filter(child => child.discriminator === 'host') as Branch<Host, Leaf<Vm>>[]
)

const vms = computed(() => props.pool.children.filter(child => child.discriminator === 'vm') as Leaf<Vm>[])
</script>
