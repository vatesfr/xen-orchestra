<template>
  <UiCard class="pool-dashboard-patches">
    <div class="title">
      <UiCardTitle>
        {{ t('patches') }}
        <template v-if="!noMissingPatches" #info>
          <span class="missing-patches-info"> {{ t('n-missing', missingPatches.length) }}</span>
        </template>
      </UiCardTitle>
    </div>
    <div class="table-wrapper">
      <PatchesTable />
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { usePatchesTable } from '@core/tables/use-patches-table'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard, hasError } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const areMissingPatchesReady = computed(() => poolDashboard?.hosts?.missingPatches !== undefined)

const missingPatches = computed(() => {
  if (poolDashboard?.hosts?.missingPatches?.hasAuthorization) {
    return poolDashboard?.hosts?.missingPatches?.missingPatches ?? []
  }

  return []
})

const nMissingPatches = computed(() => missingPatches.value.length)

const noMissingPatches = computed(() => nMissingPatches.value === 0)

const PatchesTable = usePatchesTable(missingPatches, {
  ready: areMissingPatchesReady,
  empty: noMissingPatches,
  error: computed(() => hasError),
})
</script>

<style lang="postcss" scoped>
.pool-dashboard-patches {
  max-height: 46.2rem;

  .missing-patches-info {
    color: var(--color-danger-txt-base);
  }

  .table-wrapper {
    overflow-y: auto;
    margin-inline: -2.4rem;
    margin-block-end: -1.2rem;
    border-block: 0.1rem solid var(--color-neutral-border);

    .table {
      margin-top: -0.1rem;
    }
  }
}
</style>
