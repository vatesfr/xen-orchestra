import { useXoVmMigrateJob } from '@/modules/vm/jobs/xo-vm-migrate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { VmMigratePayloadByVmId } from '@/modules/vm/types/vm-migrate.type.ts'
import { useDrawer } from '@core/packages/drawer/use-drawer.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { VM_OPERATIONS } from '@vates/types'
import { computed, ref, type MaybeRefOrGetter } from 'vue'

export function useVmMigrateDrawer(rawVms: MaybeRefOrGetter<FrontXoVm[]>) {
  const vms = toComputed(rawVms)

  const payloads = ref<VmMigratePayloadByVmId>()

  const { run, isRunning, errorMessage } = useXoVmMigrateJob(vms, payloads)

  const openDrawer = useDrawer(() => ({
    component: import('@/modules/vm/components/migrate/VmMigrateDrawer.vue'),
    props: { vms: vms.value },
    onConfirm: async (confirmedPayloads: VmMigratePayloadByVmId) => {
      payloads.value = confirmedPayloads

      try {
        await run()
      } catch (error) {
        console.error('Error when migrating VM:', error)
      }
    },
  }))

  const isBlocked = computed(() =>
    vms.value.some(
      vm => vm.blockedOperations[VM_OPERATIONS.POOL_MIGRATE] || vm.blockedOperations[VM_OPERATIONS.MIGRATE_SEND]
    )
  )

  return { openDrawer, isBlocked, isRunning, errorMessage }
}
