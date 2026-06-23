<template>
  <VdiHeaderBreadcrumbLink :vm :sr :vdi :vdi-snapshot :from-context />
  <VdiHeaderBar v-if="vdi" :vdi :vbds :vbd :vm />
  <VdiSnapshotHeaderBar v-if="vdiSnapshot" :vdi-snapshot />
</template>

<script lang="ts" setup>
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiHeaderBar from '@/modules/vdi/components/header/VdiHeaderBar.vue'
import VdiHeaderBreadcrumbLink from '@/modules/vdi/components/header/VdiHeaderBreadcrumbLink.vue'
import VdiSnapshotHeaderBar from '@/modules/vdi/components/header/VdiSnapshotHeaderBar.vue'
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
  vdiSnapshot?: FrontXoVdiSnapshot
}>()
</script>
