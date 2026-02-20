<template>
  <div class="snapshots" :class="{ mobile: uiStore.isSmall }">
    <div>
      <div class="cards">
        <VmSnapshotLastSnapshot v-if="lastSnapshot" :snapshot="lastSnapshot" />
        <VmSnapshotLastRevert v-if="lastRevertSnapshot" :snapshot="lastRevertSnapshot" />
      </div>
      <UiCard class="container">
        <SnapshotsTable :snapshots :vm />
      </UiCard>
    </div>
    <SnapshotSidePanel v-if="selectedSnapshot" :snapshot="selectedSnapshot" @close="selectedSnapshot = undefined" />
    <UiPanel v-else-if="!uiStore.isSmall">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import SnapshotSidePanel from '@/modules/snapshot/components/list/panel/SnapshotSidePanel.vue'
import {
  type FrontXoVmSnapshot,
  useXoVmSnapshotCollection,
} from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import SnapshotsTable from '@/modules/snapshot/components/SnapshotsTable.vue'
import VmSnapshotLastRevert from '@/modules/vm/components/snapshot/VmSnapshotLastRevert.vue'
import VmSnapshotLastSnapshot from '@/modules/vm/components/snapshot/VmSnapshotLastSnapshot.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useArrayFilter } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { snapshots: snapshotsCollection, getSnapshotById } = useXoVmSnapshotCollection()

const uiStore = useUiStore()

const { t } = useI18n()

const snapshots = useArrayFilter(snapshotsCollection, snapshot => snapshot.$snapshot_of === vm.id)

const selectedSnapshot = useRouteQuery<FrontXoVmSnapshot | undefined>('id', {
  toData: id => getSnapshotById(id as FrontXoVmSnapshot['id']),
  toQuery: snapshot => snapshot?.id ?? '',
})

// Get last snapshot
const lastSnapshot = computed(() => {
  if (snapshots.value.length === 0) return undefined

  return snapshots.value.reduce((latest, current) => {
    return current.snapshot_time > latest.snapshot_time ? current : latest
  })
})

// Get last revert snapshot
const lastRevertSnapshot = computed(() => {
  if (snapshots.value.length === 0 || !vm.parent) return undefined

  return snapshots.value.find(snapshot => snapshot.id === (vm.parent as any))
})
</script>

<style scoped lang="postcss">
.snapshots {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }

  .cards {
    margin: 0.8rem;
    gap: 0.8rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  &.mobile {
    .cards {
      grid-template-columns: 1fr;
    }
  }
}
</style>
