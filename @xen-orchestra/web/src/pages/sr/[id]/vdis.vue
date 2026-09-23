<template>
  <VtsContentSidePanel class="vdis">
    <UiCard class="container">
      <VdisTable :vdis="allVdis" :sr-scope :busy="!isReady" :error="hasFetchError" />
    </UiCard>
    <VdiSidePanel :vdi="selectedVdi" :sr-scope @close="selectedVdi = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { parseSrScopeQuery } from '@/modules/storage-repository/utils/sr-scope.util.ts'
import VdiSidePanel from '@/modules/vdi/components/list/panel/VdiSidePanel.vue'
import VdisTable from '@/modules/vdi/components/list/VdisTable.vue'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import {
  type FrontXoVdiSnapshot,
  useXoVdiSnapshotCollection,
} from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { logicAnd, logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const route = useRoute()

const srScope = computed(() => parseSrScopeQuery(route.query))

const { useGetVdisByIds, areVdisReady, hasVdiFetchError } = useXoVdiCollection()
const { useGetVdiSnapshotsByIds, areVdiSnapshotsReady, hasVdiSnapshotFetchError } = useXoVdiSnapshotCollection()

const isReady = logicAnd(areVdisReady, areVdiSnapshotsReady)
const hasFetchError = logicOr(hasVdiFetchError, hasVdiSnapshotFetchError)

const vdis = useGetVdisByIds(() => sr.VDIs as FrontXoVdi['id'][])
const vdiSnapshots = useGetVdiSnapshotsByIds(() => sr.VDIs as FrontXoVdiSnapshot['id'][])

const allVdis = computed(() => [...vdis.value, ...vdiSnapshots.value])

const selectedVdi = useRouteQuery<FrontXoVdi | FrontXoVdiSnapshot | undefined>('id', {
  toData: id => allVdis.value.find(vdi => vdi.id === id),
  toQuery: vdi => vdi?.id ?? '',
})
</script>

<style scoped lang="postcss">
.vdis {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
