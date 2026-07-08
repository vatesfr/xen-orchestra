<template>
  <VtsColumns extra-space-around>
    <VtsColumn>
      <VdiDetailGeneralInfo :vdi :vbd :vdi-snapshot />
      <VdiDetailSpace :vdi :vdi-snapshot />
    </VtsColumn>
    <VtsColumn>
      <VdiDetailConfiguration :vdi :vdi-snapshot />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDetailConfiguration from '@/modules/vdi/components/detail/VdiDetailConfiguration.vue'
import VdiDetailGeneralInfo from '@/modules/vdi/components/detail/VdiDetailGeneralInfo.vue'
import VdiDetailSpace from '@/modules/vdi/components/detail/VdiDetailSpace.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

defineProps<{
  vdi?: FrontXoVdi
  vbd?: FrontXoVbd
  vdiSnapshot?: FrontXoVdiSnapshot
}>()
</script>
