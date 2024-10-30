<template>
  <TreeItem v-if="host !== undefined" :expanded="isExpanded" class="infra-host-item">
    <TreeItemLabel :icon="faServer" :route="{ name: 'host.dashboard', params: { uuid: host.uuid } }" @toggle="toggle()">
      {{ host.name_label || '(Host)' }}
      <template #addons>
        <VtsIcon v-if="isPoolMaster" v-tooltip="$t('master')" :icon="faStar" accent="warning" />
        <VtsCounter
          v-if="isReady"
          v-tooltip="$t('running-vm', { count: vmCount })"
          :value="vmCount"
          accent="info"
          variant="secondary"
          size="small"
        />
      </template>
    </TreeItemLabel>
    <template #sublist>
      <TreeList>
        <InfraVmItems :host-opaque-ref="hostOpaqueRef" />
      </TreeList>
    </template>
  </TreeItem>
</template>

<script lang="ts" setup>
import InfraVmItems from '@/components/infra/InfraVmItems.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsCounter from '@core/components/counter/VtsCounter.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faServer, faStar } from '@fortawesome/free-solid-svg-icons'
import { useToggle } from '@vueuse/shared'
import { computed } from 'vue'

const props = defineProps<{
  hostOpaqueRef: XenApiHost['$ref']
}>()

const { getByOpaqueRef } = useHostStore().subscribe()
const host = computed(() => getByOpaqueRef(props.hostOpaqueRef))

const { pool } = usePoolStore().subscribe()
const isPoolMaster = computed(() => pool.value?.master === props.hostOpaqueRef)

const { recordsByHostRef, isReady } = useVmStore().subscribe()

const vmCount = computed(() => recordsByHostRef.value.get(props.hostOpaqueRef)?.length ?? 0)

const [isExpanded, toggle] = useToggle(true)
</script>
