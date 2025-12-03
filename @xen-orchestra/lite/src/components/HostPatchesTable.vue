<template>
  <VtsTable :state>
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="patch of sortedPatches" :key="patch.$id">
        <BodyCells :item="patch" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script lang="ts" setup>
import type { XenApiPatchWithHostRefs } from '@/composables/host-patches.composable'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { useTableState } from '@core/composables/table-state.composable'
import { usePatchColumns } from '@core/tables/column-sets/patch-columns'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { patches, busy } = defineProps<{
  patches: XenApiPatchWithHostRefs[]
  busy?: boolean
}>()

const { t } = useI18n()

const sortedPatches = computed(() =>
  [...patches].sort((patch1, patch2) => {
    if (patch1.changelog == null) {
      return 1
    } else if (patch2.changelog == null) {
      return -1
    }

    return patch1.changelog.date - patch2.changelog.date
  })
)

const state = useTableState({
  busy: () => busy,
  empty: () => (patches.length === 0 ? { type: 'all-good', message: t('patches-up-to-date') } : false),
})

const { HeadCells, BodyCells } = usePatchColumns({
  body: (patch: XenApiPatchWithHostRefs) => ({
    name: r => r(patch.name),
    version: r => r(patch.version),
  }),
})
</script>

<style lang="postcss" scoped>
.hosts-patches-table.desktop {
  max-width: 45rem;
}
</style>
