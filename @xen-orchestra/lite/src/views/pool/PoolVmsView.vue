<template>
  <UiCard class="pool-vms-view">
    <UiCardTitle subtitle>
      {{ $t('vms') }}
      <template v-if="uiStore.isMobile" #right>
        <VmsActionsBar :selected-refs="selectedVmsRefs" />
      </template>
    </UiCardTitle>
    <VmsActionsBar v-if="uiStore.isDesktop" :selected-refs="selectedVmsRefs" />
    <CollectionTable
      v-model="selectedVmsRefs"
      :available-filters="filters"
      :available-sorts="filters"
      :collection="vms"
    >
      <template #head-row>
        <ColumnHeader :icon="faPowerOff" />
        <ColumnHeader>{{ $t('name') }}</ColumnHeader>
        <ColumnHeader>{{ $t('description') }}</ColumnHeader>
      </template>
      <template #body-row="{ item: vm }">
        <td>
          <PowerStateIcon :state="vm.power_state" />
        </td>
        <td>
          <div class="vm-name">
            <UiSpinner v-if="isMigrating(vm)" v-tooltip="'This VM is being migrated'" />
            {{ vm.name_label }}
          </div>
        </td>
        <td>{{ vm.name_description }}</td>
      </template>
    </CollectionTable>
  </UiCard>
</template>

<script lang="ts" setup>
import CollectionTable from '@/components/CollectionTable.vue'
import ColumnHeader from '@/components/ColumnHeader.vue'
import PowerStateIcon from '@/components/PowerStateIcon.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import VmsActionsBar from '@/components/vm/VmsActionsBar.vue'
import { isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import type { Filters } from '@/types/filter'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useUiStore } from '@core/stores/ui.store'
import { faPowerOff } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const titleStore = usePageTitleStore()
titleStore.setTitle(t('vms'))

const { records: vms } = useVmStore().subscribe()
const uiStore = useUiStore()

const filters: Filters = {
  name_label: { label: t('name'), type: 'string' },
  name_description: { label: t('description'), type: 'string' },
  power_state: {
    label: t('power-state'),
    icon: faPowerOff,
    type: 'enum',
    choices: Object.values(VM_POWER_STATE),
  },
}

const selectedVmsRefs = ref([])

titleStore.setCount(() => selectedVmsRefs.value.length)

const isMigrating = (vm: XenApiVm) => isVmOperationPending(vm, VM_OPERATION.POOL_MIGRATE)
</script>

<style lang="postcss" scoped>
.pool-vms-view {
  overflow: auto;
  margin: 1rem;
}

.vm-name {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
}
</style>
