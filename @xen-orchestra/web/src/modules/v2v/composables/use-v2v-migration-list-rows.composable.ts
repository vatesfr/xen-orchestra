import { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vPoolQuery } from '@/modules/v2v/composables/use-v2v-pool-query.composable.ts'
import { useV2vSourceAndDestination } from '@/modules/v2v/composables/use-v2v-source-and-destination.composable.ts'
import { useV2vVmRows } from '@/modules/v2v/composables/use-v2v-vm-rows.composable.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import { computed } from 'vue'

// The migration list of the connected source for the pool of the route, and the VMs of that source as rows
export function useV2vMigrationListRows() {
  const connectionStore = useV2vConnectionStore()

  const poolId = useV2vPoolQuery()

  const { sourceHost } = useV2vSourceAndDestination(poolId)

  const migrationList = useV2vMigrationList(() => connectionStore.sourceId, poolId)

  const listVmIds = computed(() => migrationList.list.value?.vms.map(vm => vm.id) ?? [])

  const { rows, areRowsReady } = useV2vVmRows(() => new Set(listVmIds.value))

  return { poolId, sourceHost, migrationList, listVmIds, rows, areRowsReady }
}
