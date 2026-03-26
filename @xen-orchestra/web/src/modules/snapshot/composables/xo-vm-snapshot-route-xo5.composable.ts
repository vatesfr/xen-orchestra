import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'

export function useXo5VmSnapshotRoute() {
  const { buildXo5Route } = useXoRoutes()

  const buildXo5VmSnapshotRoute = (vmId: FrontXoVm['id'], snapshotId: FrontXoVmSnapshot['id']) =>
    buildXo5Route(`/vms/${vmId}/snapshots?s=1_0_asc-${snapshotId}`)

  return { buildXo5VmSnapshotRoute }
}
