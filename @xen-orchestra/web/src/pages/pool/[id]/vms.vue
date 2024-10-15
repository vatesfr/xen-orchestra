<template>
  <VtsLoadingHero v-if="!isReady" type="page" />
  <UiCard v-else class="vms">
    <!-- TODO: update with item selection button and TopBottomTable component when available -->
    <p class="typo p3-regular count">{{ $t('n-vms', { n: vms.length }) }}</p>
    <VtsTable vertical-border>
      <thead>
        <tr>
          <ColumnTitle id="vm" :icon="faDesktop">{{ $t('vm') }}</ColumnTitle>
          <ColumnTitle id="description" :icon="faAlignLeft">{{ $t('vm-description') }}</ColumnTitle>
        </tr>
      </thead>
      <tbody>
        <tr v-for="vm in vms" :key="vm.id">
          <CellObject :id="vm.data.id">
            <UiObjectLink :route="`/vm/${vm.data.id}/console`">
              <template #icon>
                <UiObjectIcon size="medium" :state="vm.data.power_state.toLocaleLowerCase() as VmState" type="vm" />
              </template>
              {{ vm.data.name_label }}
            </UiObjectLink>
          </CellObject>
          <CellText>{{ vm.data.name_description }}</CellText>
        </tr>
      </tbody>
    </VtsTable>
  </UiCard>
</template>

<script lang="ts" setup>
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { XoPool } from '@/types/xo/pool.type'
import type { VmState } from '@core/types/object-icon.type'
import CellObject from '@core/components/cell-object/CellObject.vue'
import CellText from '@core/components/cell-text/CellText.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import { defineTree } from '@core/composables/tree/define-tree'
import { useTree } from '@core/composables/tree.composable'
import { faAlignLeft, faDesktop } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  pool: XoPool
}>()

const { isReady, records } = useVmStore().subscribe()

const vmsByPool = computed(() => records.value.filter(vm => vm.$pool === props.pool.id))

const definitions = computed(() =>
  defineTree(vmsByPool.value ?? [], {
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
  color: var(--color-neutral-txt-secondary);
}
</style>
