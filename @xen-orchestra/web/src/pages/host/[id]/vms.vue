<template>
  <LoadingHero v-if="!isReady" type="page" />
  <UiCard v-else class="vms">
    <!-- TODO: update with item selection button and TopBottomTable component when available -->
    <p class="typo p3-regular count">{{ $t('n-vms', { n: vms.length }) }}</p>
    <UiTable vertical-border>
      <thead>
        <tr>
          <ColumnTitle id="vm" :icon="faDesktop">{{ $t('vm') }}</ColumnTitle>
          <ColumnTitle id="description" :icon="faAlignLeft">{{ $t('vm-description') }}</ColumnTitle>
        </tr>
      </thead>
      <tbody>
        <tr v-for="vm in vms" :key="vm.id">
          <CellObject :id="vm.data.id">
            <ObjectLink :route="`/vm/${vm.data.id}/console`">
              <template #icon>
                <ObjectIcon :state="vm.data.power_state.toLocaleLowerCase() as VmState" type="vm" />
              </template>
              {{ vm.data.name_label }}
            </ObjectLink>
          </CellObject>
          <CellText>{{ vm.data.name_description }}</CellText>
        </tr>
      </tbody>
    </UiTable>
  </UiCard>
</template>

<script lang="ts" setup>
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { Host } from '@/types/host.type'
import type { VmState } from '@core/types/object-icon.type'
import CellObject from '@core/components/cell-object/CellObject.vue'
import CellText from '@core/components/cell-text/CellText.vue'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import ObjectLink from '@core/components/object-link/ObjectLink.vue'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import UiTable from '@core/components/table/UiTable.vue'
import UiCard from '@core/components/UiCard.vue'
import { defineTree } from '@core/composables/tree/define-tree'
import { useTree } from '@core/composables/tree.composable'
import { faAlignLeft, faDesktop } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  host: Host
}>()

const { isReady, vmsByHost } = useVmStore().subscribe()

const definitions = computed(() =>
  defineTree(vmsByHost.value.get(props.host.id) ?? [], {
    getLabel: 'name_label',
  })
)

const { nodes: vms } = useTree(definitions)
</script>

<style lang="postcss" scoped>
.vms {
  margin: 1rem;
  gap: 0.8rem;
}

.count {
  color: var(--color-grey-200);
}
</style>
