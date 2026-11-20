<template>
  <div class="new-vm-review-vifs-table">
    <VtsTable v-if="vifs.length > 0">
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="vif of vifs" :key="vif.key">
          <BodyCells :item="vif" />
        </VtsRow>
      </tbody>
    </VtsTable>
    <p v-else class="typo-body-regular">{{ t('new-vm:no-vif-configured') }}</p>
    <UiOverridden v-if="deletedCount > 0">{{ t('new-vm:n-vifs-deleted', deletedCount) }}</UiOverridden>
  </div>
</template>

<script lang="ts" setup>
import NewVmReviewMarker from '@/modules/vm/components/new/review/NewVmReviewMarker.vue'
import type { NewVmReviewVif } from '@/modules/vm/composables/use-new-vm-review.composable.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiOverridden from '@core/components/ui/overridden/UiOverridden.vue'
import { useNewVmReviewVifColumns } from '@core/tables/column-sets/new-vm-review-vif-columns.ts'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  vifs: NewVmReviewVif[]
  deletedCount: number
}>()

const { t } = useI18n()

const { HeadCells, BodyCells } = useNewVmReviewVifColumns({
  body: (vif: NewVmReviewVif) => ({
    rank: r => r(vif.rank),
    network: r => r(vif.network),
    mac: r => r(vif.mac),
    marker: r => r(h(NewVmReviewMarker, { marker: vif.marker })),
  }),
})
</script>

<style lang="postcss" scoped>
.new-vm-review-vifs-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
