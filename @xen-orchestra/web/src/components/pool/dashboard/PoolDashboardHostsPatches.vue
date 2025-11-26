<template>
  <UiCard :has-error class="pool-dashboard-patches">
    <div class="title">
      <UiCardTitle>
        {{ t('patches') }}
        <template v-if="!noMissingPatches" #info>
          <span class="missing-patches-info"> {{ t('n-missing', missingPatches.length) }}</span>
        </template>
      </UiCardTitle>
    </div>
    <VtsStateHero v-if="!areMissingPatchesReady" format="card" busy size="medium" />
    <VtsStateHero v-else-if="noMissingPatches" format="card" type="all-done" size="small">
      <span> {{ t('all-good') }} </span>
      <span>{{ t('patches-up-to-date') }}</span>
    </VtsStateHero>
    <div v-else class="table-wrapper">
      <HostPatchesTable :patches="missingPatches" />
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import HostPatchesTable from '@/components/host/HostPatchesTable.vue'
import type { MissingPatch } from '@/remote-resources/use-xo-host-missing-patches-collection'
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const areMissingPatchesReady = computed(() => poolDashboard?.hosts?.missingPatches !== undefined)

const missingPatches = computed(() => {
  if (poolDashboard?.hosts?.missingPatches?.hasAuthorization) {
    return (poolDashboard?.hosts?.missingPatches?.missingPatches ?? []) as MissingPatch[]
  }

  return [] as MissingPatch[]
})

const nMissingPatches = computed(() => missingPatches.value.length)

const noMissingPatches = computed(() => nMissingPatches.value === 0)
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

  .version {
    text-align: end;
  }
}
</style>
