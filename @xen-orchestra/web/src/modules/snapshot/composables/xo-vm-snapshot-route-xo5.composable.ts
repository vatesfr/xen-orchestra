import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'

export function useXo5VmSnapshotRoute() {
  const { buildXo5Route } = useXoRoutes()

  const buildXo5VmSnapshotRoute = (vmId: string, snapshotId: string) =>
    buildXo5Route(`/vms/${vmId}/snapshots?s=1_0_asc-${snapshotId}`)

  return { buildXo5VmSnapshotRoute }
}
