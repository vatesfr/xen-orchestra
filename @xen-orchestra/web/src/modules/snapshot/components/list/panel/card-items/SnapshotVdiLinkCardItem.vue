<template>
  <UiLink
    :to="{ name: '/vdi/[id]', params: { id: vdi.$snapshot_of }, query: { from: 'snapshot' } }"
    :icon="vbdsSnapshotStatus"
    size="medium"
  >
    {{ vdi.name_label }}
  </UiLink>
</template>

<script setup lang="ts">
import type { FrontXoVmSnapshotVdi } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-vdi-collection.ts'
import { useVbdsStatus, type VbdAttachmentStatus } from '@/modules/vbd/composables/use-vbds-status.composable.ts'
import type { IconName } from '@core/icons'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useMapper } from '@core/packages/mapper'

const { vdi } = defineProps<{ vdi: FrontXoVmSnapshotVdi }>()

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
