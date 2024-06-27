<template>
  <TreeItem :expanded="host.isExpanded">
    <TreeItemLabel :icon="faServer" :no-indent="!hasVMs" :route="`/host/${host.id}`" @toggle="host.toggleExpand()">
      {{ host.label }}
      <template #addons>
        <UiIcon v-if="isMaster" v-tooltip="$t('master')" :icon="faStar" color="warning" />
      </template>
    </TreeItemLabel>
    <template #sublist>
      <TreeList>
        <InfraVmList :vms="host.children" />
      </TreeList>
    </template>
  </TreeItem>
</template>

<script lang="ts" setup>
import InfraVmList from '@/components/infra/InfraVmList.vue'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { Host } from '@/types/host.type'
import type { Vm } from '@/types/vm.type'
import type { Branch } from '@core/composables/tree/branch'
import type { Leaf } from '@core/composables/tree/leaf'
import UiIcon from '@core/components/icon/UiIcon.vue'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faServer, faStar } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  host: Branch<Host, Leaf<Vm>>
}>()

const { isMasterHost } = useHostStore().subscribe()

const isMaster = computed(() => isMasterHost(props.host.data.id))

const hasVMs = computed(() => props.host.children.length > 0)
</script>
