<template>
  <TreeItem v-if="host !== undefined">
    <TreeItemLabel :icon="faServer" :no-indent="host.residentVms.length > 0" route="bar">
      {{ host.name_label }}
      <template #addons>
        <UiIcon v-if="isMaster" :icon="faStar" color="warning" />
      </template>
    </TreeItemLabel>
    <template v-if="host.residentVms.length > 0" #sublist>
      <InfraVmList :host-id="host.id" />
    </template>
  </TreeItem>
</template>

<script lang="ts" setup>
import InfraVmList from '@/components/infra/InfraVmList.vue'
import type { Host } from '@/stores/xo-rest-api/create-xo-store-config'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import UiIcon from '@core/components/icon/UiIcon.vue'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import { faServer, faStar } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  host: Host
}>()

const { isMasterHost } = usePoolStore().subscribe()

const isMaster = computed(() => isMasterHost(props.host.id))
</script>
