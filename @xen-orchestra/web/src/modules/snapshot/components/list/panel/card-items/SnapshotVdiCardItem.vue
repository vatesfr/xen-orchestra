<template>
  <UiLink :icon="vbdsSnapshotStatus" size="medium" :href="xo5VmSnapshotVdiHref">{{ vdi.name_label }}</UiLink>
</template>

<script setup lang="ts">
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import type { IconName } from '@core/icons'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useMapper } from '@core/packages/mapper'
import { computed } from 'vue'

const { snapshot, vdi } = defineProps<{ snapshot: FrontXoVmSnapshot; vdi: FrontXoVdi }>()

const { buildXo5Route } = useXoRoutes()
const xo5VmSnapshotVdiHref = computed(() => buildXo5Route(`/vms/${snapshot.id}/disks`))

const { getVbdsByIds } = useXoVbdCollection()

type SnapshotVdiStatus = 'attached' | 'detached' | 'disabled'

const vdiStatus = computed<SnapshotVdiStatus>(() => {
  const allSnapshotVdiVbds = getVbdsByIds(vdi.$VBDs)

  if (allSnapshotVdiVbds.length === 0) return 'detached'

  const areVdiVbdsAttached = allSnapshotVdiVbds.map(vbd => vbd.attached)

  if (areVdiVbdsAttached.every(Boolean)) return 'attached'
  if (areVdiVbdsAttached.some(Boolean)) return 'disabled'

  return 'detached'
})

const vbdsSnapshotStatus = useMapper<SnapshotVdiStatus, IconName>(
  () => vdiStatus.value,
  {
    attached: 'object:vdi:attached',
    detached: 'object:vdi:detached',
    disabled: 'object:vdi:disabled',
  },
  'detached'
)
</script>
