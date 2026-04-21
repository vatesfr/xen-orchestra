import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoVmSnapshotsArg = defineJobArg({
  identify: (snapshot: FrontXoVmSnapshot) => snapshot.id,
  toArray: true,
})
