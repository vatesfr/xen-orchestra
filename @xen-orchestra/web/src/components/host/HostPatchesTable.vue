<template>
  <VtsTableNew sticky="right">
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="patch of patches" :key="`${patch.name}-${patch.version ?? patch.date}`">
        <BodyCells :item="patch" />
      </VtsRow>
    </tbody>
  </VtsTableNew>
</template>

<script setup lang="ts">
import type { MissingPatch } from '@/remote-resources/use-xo-host-missing-patches-collection'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import { usePatchColumns } from '@core/tables/column-sets/patch-columns'

defineProps<{
  patches: MissingPatch[]
}>()

const { HeadCells, BodyCells } = usePatchColumns({
  body: (patch: MissingPatch) => ({
    name: r => r(patch.name),
    version: r => r(patch.version),
  }),
})
</script>
