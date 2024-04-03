<template>
  <TreeItem v-if="host !== undefined" class="infra-host-item">
    <TreeItemLabel :icon="faServer" :route="{ name: 'host.dashboard', params: { uuid: host.uuid } }">
      {{ host.name_label || '(Host)' }}
      <template #addons>
        <UiIcon v-if="isPoolMaster" v-tooltip="$t('core.master')" :icon="faStar" color="warning" />
        <UiCounter v-if="isReady" v-tooltip="$t('vm-running', { count: vmCount })" :value="vmCount" color="info" />
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
import { useHostCollection } from '@/stores/xen-api/host.store'
import { usePoolCollection } from '@/stores/xen-api/pool.store'
import { useVmCollection } from '@/stores/xen-api/vm.store'
import UiIcon from '@core/components/icon/UiIcon.vue'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import UiCounter from '@core/components/UiCounter.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faServer, faStar } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  hostOpaqueRef: XenApiHost['$ref']
}>()

const { getByOpaqueRef } = useHostCollection()
const host = computed(() => getByOpaqueRef(props.hostOpaqueRef))

const { pool } = usePoolCollection()
const isPoolMaster = computed(() => pool.value?.master === props.hostOpaqueRef)

const { recordsByHostRef, isReady } = useVmCollection()

const vmCount = computed(() => recordsByHostRef.value.get(props.hostOpaqueRef)?.length ?? 0)
</script>
