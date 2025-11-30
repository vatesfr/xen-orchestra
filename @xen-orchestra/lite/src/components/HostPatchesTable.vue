<template>
  <VtsTable :busy :empty="patches.length === 0">
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
import { usePatchColumns } from '@core/tables/column-sets/patch-columns'
import { computed } from 'vue'

const props = defineProps<{
  patches: XenApiPatchWithHostRefs[]
  busy?: boolean
}>()

const sortedPatches = computed(() =>
  [...props.patches].sort((patch1, patch2) => {
    if (patch1.changelog == null) {
      return 1
    } else if (patch2.changelog == null) {
      return -1
    }

    return patch1.changelog.date - patch2.changelog.date
  })
)

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

.counter {
  font-size: 1rem;
}
</style>
