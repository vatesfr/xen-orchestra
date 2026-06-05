<template>
  <VtsColumns extra-space-around>
    <UiCard class="container">
      <div class="content">
        <!--
          WIP: vdis
          <VdisTable :vdis="vdis" :vm="{}" />
        -->
      </div>
    </UiCard>
  </VtsColumns>
</template>

<script setup lang="ts">
/*
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VdisTable from '@/modules/vdi/components/list/VdisTable.vue'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
*/
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
/*
const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { useGetVdisByIds } = useXoVdiCollection()

const vdis = useGetVdisByIds(() => sr.VDIs as FrontXoVdi['id'][])
*/
</script>
