<template>
  <VdiHeaderBreadcrumbLink :vm :sr :vdi :snapshot :from-context />
  <VdiHeadBar v-if="vdi" :vdi :vbds :vbd :vm />
  <VdiSnapshotHeadBar v-if="snapshot" :snapshot />
</template>

<script lang="ts" setup>
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiHeadBar from '@/modules/vdi/components/header/VdiHeadBar.vue'
import VdiHeaderBreadcrumbLink from '@/modules/vdi/components/header/VdiHeaderBreadcrumbLink.vue'
import VdiSnapshotHeadBar from '@/modules/vdi/components/header/VdiSnapshotHeadBar.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { VdiPageContext } from '@/shared/constants.ts'

const { vdi, vm, vbds, vbd } = defineProps<{
  vdi?: FrontXoVdi
  vm?: FrontXoVm
  vbds?: FrontXoVbd[]
  vbd?: FrontXoVbd
  sr?: FrontXoSr
  fromContext?: VdiPageContext
  snapshot?: FrontXoVdiSnapshot
}>()
</script>
