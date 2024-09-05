<template>
  <LoadingHero v-if="!isReady" type="page" />
  <UiCard v-else class="hosts">
    <!-- TODO: update with item selection button and TopBottomTable component when available -->
    <p class="typo p3-regular count">{{ $t('n-hosts', { n: hosts.length }) }}</p>
    <UiTable vertical-border>
      <thead>
        <tr>
          <ColumnTitle id="host" :icon="faServer">{{ $t('host') }}</ColumnTitle>
          <ColumnTitle id="description" :icon="faAlignLeft">{{ $t('host-description') }}</ColumnTitle>
        </tr>
      </thead>
      <tbody>
        <tr v-for="host in hosts" :key="host.id">
          <CellObject :id="host.data.id">
            <ObjectLink :route="`/host/${host.data.id}`">
              <template #icon>
                <ObjectIcon type="host" :state="host.data.power_state.toLocaleLowerCase() as HostState" />
              </template>
              {{ host.data.name_label }}
            </ObjectLink>
          </CellObject>
          <CellText>{{ host.data.name_description }}</CellText>
        </tr>
      </tbody>
    </UiTable>
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoPool } from '@/types/xo/pool.type'
import type { HostState } from '@core/types/object-icon.type'
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
import { faAlignLeft, faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  pool: XoPool
}>()

const { isReady, hostsByPool } = useHostStore().subscribe()

const definitions = computed(() =>
  defineTree(hostsByPool.value.get(props.pool.id) ?? [], {
    getLabel: 'name_label',
  })
)

const { nodes: hosts } = useTree(definitions)
</script>

<style lang="postcss" scoped>
.hosts {
  margin: 1rem;
  gap: 0.8rem;
}

.count {
  color: var(--color-grey-200);
  text-transform: lowercase;
}
</style>
