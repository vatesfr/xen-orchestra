<template>
  <UiLink :icon="vbdsSnapshotStatus" size="medium" :href="xo5VmSnapshotVdiHref">{{ vdi.name_label }}</UiLink>
</template>

<script setup lang="ts">
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import type { FrontXoVmSnapshotVdi } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-vdi-collection.ts'
import { useVbdsStatus, type VbdAttachmentStatus } from '@/modules/vbd/composables/use-vbds-status.composable.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import type { IconName } from '@core/icons'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useMapper } from '@core/packages/mapper'
import { computed } from 'vue'

const { snapshot, vdi } = defineProps<{ snapshot: FrontXoVmSnapshot; vdi: FrontXoVmSnapshotVdi }>()

const { buildXo5Route } = useXoRoutes()
const xo5VmSnapshotVdiHref = computed(() => buildXo5Route(`/vms/${snapshot.id}/disks`))

const vbdsStatus = useVbdsStatus(() => vdi.$VBDs)

const vbdsSnapshotStatus = useMapper<VbdAttachmentStatus, IconName>(
  () => vbdsStatus.value,
  {
    allAttached: 'object:vdi:attached',
    someAttached: 'object:vdi:disabled',
    noneAttached: 'object:vdi:detached',
  },
  'someAttached'
)
</script>
