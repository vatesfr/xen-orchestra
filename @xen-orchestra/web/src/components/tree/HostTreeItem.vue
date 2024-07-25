<template>
  <TreeItem :expanded="branch.isExpanded">
    <TreeItemLabel
      :icon="faServer"
      :no-indent="!hasVMs"
      :route="`/host/${branch.data.id}`"
      @toggle="branch.toggleExpand()"
    >
      {{ branch.data.name_label }}
      <template #addons>
        <UiIcon v-if="isMaster" v-tooltip="$t('master')" :icon="faStar" color="warning" />
      </template>
    </TreeItemLabel>
    <template v-if="branch.hasChildren" #sublist>
      <TreeList>
        <VmTreeList :leaves="branch.children" />
      </TreeList>
    </template>
  </TreeItem>
</template>

<script lang="ts" setup>
import VmTreeList from '@/components/tree/VmTreeList.vue'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { HostBranch } from '@/types/host.type'
import UiIcon from '@core/components/icon/UiIcon.vue'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faServer, faStar } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  branch: HostBranch
}>()

const { isMasterHost } = useHostStore().subscribe()

const isMaster = computed(() => isMasterHost(props.branch.data.id))

const hasVMs = computed(() => props.branch.children.length > 0)
</script>
