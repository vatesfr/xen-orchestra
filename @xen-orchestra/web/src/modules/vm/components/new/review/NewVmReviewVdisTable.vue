<template>
  <div class="new-vm-review-vdis-table">
    <VtsTable>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="vdi of vdis" :key="vdi.key">
          <BodyCells :item="vdi" />
        </VtsRow>
      </tbody>
    </VtsTable>
    <UiOverridden v-if="deletedCount > 0">{{ t('new-vm:n-vdis-deleted', deletedCount) }}</UiOverridden>
  </div>
</template>

<script lang="ts" setup>
import NewVmReviewMarker from '@/modules/vm/components/new/review/NewVmReviewMarker.vue'
import type { NewVmReviewVdi } from '@/modules/vm/composables/use-new-vm-review.composable.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiOverridden from '@core/components/ui/overridden/UiOverridden.vue'
import { useNewVmReviewVdiColumns } from '@core/tables/column-sets/new-vm-review-vdi-columns.ts'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  vdis: NewVmReviewVdi[]
  deletedCount: number
}>()

const { t } = useI18n()

const { HeadCells, BodyCells } = useNewVmReviewVdiColumns({
  body: (vdi: NewVmReviewVdi) => ({
    rank: r => r(vdi.rank),
    sr: r => r(vdi.sr),
    diskName: r => r(vdi.name),
    size: r => r(t('n-gb', { n: vdi.size })),
    description: r => r(vdi.description),
    creation: r => r(vdi.isCopiedFromTemplate ? t('new-vm:copy-from-template-vdi') : t('new-vm:new-empty-vdi')),
    marker: r => r(h(NewVmReviewMarker, { marker: vdi.marker })),
  }),
})
</script>

<style lang="postcss" scoped>
.new-vm-review-vdis-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
