<template>
  <VtsLoadingHero v-if="!isReady" type="page" />
  <UiCard v-else class="hosts">
    <!-- TODO: update with item selection button and TopBottomTable component when available -->
    <p class="typo-body-regular-small count">{{ $t('n-hosts', { n: hosts.length }) }}</p>
    <VtsTable vertical-border>
      <thead>
        <tr>
          <ColumnTitle id="host" :icon="faServer">{{ $t('host') }}</ColumnTitle>
          <ColumnTitle id="description" :icon="faAlignLeft">{{ $t('host-description') }}</ColumnTitle>
        </tr>
      </thead>
      <tbody>
        <tr v-for="host in hosts" :key="host.id">
          <VtsCellObject :id="host.data.id">
            <UiObjectLink :route="`/host/${host.data.id}`">
              <template #icon>
                <UiObjectIcon
                  size="medium"
                  type="host"
                  :state="host.data.power_state.toLocaleLowerCase() as HostState"
                />
              </template>
              {{ host.data.name_label }}
            </UiObjectLink>
          </VtsCellObject>
          <VtsCellText>{{ host.data.name_description }}</VtsCellText>
        </tr>
      </tbody>
    </VtsTable>
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoPool } from '@/types/xo/pool.type'
import type { HostState } from '@core/types/object-icon.type'
import VtsCellObject from '@core/components/cell-object/VtsCellObject.vue'
import VtsCellText from '@core/components/cell-text/VtsCellText.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
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
  color: var(--color-neutral-txt-secondary);
  text-transform: lowercase;
}
</style>
