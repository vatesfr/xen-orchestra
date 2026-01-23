<template>
  <VtsTable :state sticky="right">
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
  </VtsTable>
</template>

<script setup lang="ts">
import type { MissingPatch } from '@/modules/host/remote-resources/use-xo-host-missing-patches-collection.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { useTableState } from '@core/composables/table-state.composable'
import { usePatchColumns } from '@core/tables/column-sets/patch-columns'
import { useI18n } from 'vue-i18n'

const { patches } = defineProps<{
  patches: MissingPatch[]
}>()

const { t } = useI18n()

const state = useTableState({
  empty: () =>
    patches.length === 0 ? { type: 'all-done', message: t('patches-up-to-date'), size: 'extra-small' } : false,
})

const { HeadCells, BodyCells } = usePatchColumns({
  body: (patch: MissingPatch) => ({
    name: r => r(patch.name),
    version: r => r(patch.version),
  }),
})
</script>
