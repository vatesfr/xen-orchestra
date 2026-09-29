<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.dataId" :has-children="branch.hasChildren">
    <UiTreeItemLabel
      :route="{ name: '/host/[uuid]', params: { uuid: branch.data.uuid } }"
      icon="object:host"
      @toggle="branch.toggleCollapse()"
    >
      {{ branch.data.name_label || '(Host)' }}
      <template #icon>
        <VtsObjectIcon v-tooltip="hostState" type="host" size="medium" :state="hostState" />
      </template>
      <template #addons>
        <UiLoader v-if="isChangingState" v-tooltip="currentOperation" />
        <VtsIcon v-if="isMaster" v-tooltip="t('master')" name="status:primary-circle" size="medium" />
        <UiCounter
          v-tooltip="t('running-vm', { count: runningVmsCount })"
          :value="runningVmsCount"
          accent="brand"
          size="small"
          variant="secondary"
        />
        <MenuList placement="bottom-start">
          <template #trigger="{ open, isOpen }">
            <UiButtonIcon
              accent="brand"
              icon="action:more-actions"
              size="small"
              :selected="isOpen"
              @click="open($event)"
            />
          </template>
          <HostMoreActions :host="branch.data" show-change-state-button />
        </MenuList>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostMoreActions from '@/modules/host/components/HostMoreActions.vue'
import { useHostUtils } from '@/modules/host/composables/host-utils.composable.ts'
import { getHostState } from '@/modules/host/utils/host.util.ts'
import type { HostBranch } from '@/modules/treeview/types/tree.type.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { branch, hostOpaqueRef } = defineProps<{
  branch: HostBranch
  hostOpaqueRef: XenApiHost['$ref']
}>()

const { t } = useI18n()

const { isMasterHost } = usePoolStore().subscribe()
const { runningVmsCountByHostRef } = useVmStore().subscribe()
const { getByOpaqueRef } = useHostStore().subscribe()
const host = computed(() => getByOpaqueRef(hostOpaqueRef))

const { getHostPowerState } = useHostMetricsStore().subscribe()

const hostState = computed(() => {
  if (host.value === undefined) {
    return 'unknown'
  }

  return getHostState(host.value, getHostPowerState(host.value))
})

const { isChangingState, currentOperation } = useHostUtils(() => branch.data)

const isMaster = computed(() => isMasterHost(branch.data.$ref))

const runningVmsCount = computed(() => runningVmsCountByHostRef.value.get(branch.data.$ref) ?? 0)
</script>
