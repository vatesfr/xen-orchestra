<template>
  <div class="snapshots" :class="{ mobile: uiStore.isSmall }">
    <div>
      <div class="row">
        <VmSnapshotCard class="last-snapshot" :snapshot="lastSnapshot" :title="t('last-snapshot')" />
        <VmSnapshotCard class="last-revert" :snapshot="lastRevertSnapshot" :title="t('last-revert')" />
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
import VmSnapshotCard from '@/modules/vm/components/snapshot/cards/VmSnapshotCard.vue'
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

const lastSnapshot = computed(() => {
  if (snapshots.value.length === 0) {
    return undefined
  }

  return snapshots.value.reduce((latest, current) => {
    return current.snapshot_time > latest.snapshot_time ? current : latest
  })
})

const lastRevertSnapshot = computed(() => {
  if (snapshots.value.length === 0 || !vm.parent) {
    return undefined
  }

  return snapshots.value.find(snapshot => snapshot.id === vm.parent)
})
</script>

<style scoped lang="postcss">
.snapshots {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40rem;

  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }

  .row {
    display: grid;
    gap: 0.8rem;
    margin: 0.8rem;
    grid-template-columns: repeat(2, minmax(20rem, 1fr));
    grid-template-areas: 'last-snapshot last-revert';
  }

  .last-snapshot {
    grid-area: last-snapshot;
  }

  .last-revert {
    grid-area: last-revert;
  }

  &.mobile {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;

    .row {
      display: flex;
      flex-direction: column;
    }
  }
}
</style>
