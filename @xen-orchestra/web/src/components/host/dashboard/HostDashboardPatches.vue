<template>
  <UiCard class="host-dashboard-patches">
    <div class="title">
      <UiCardTitle>
        {{ t('patches') }}
        <template v-if="!noMissingPatches" #info>
          <span class="missing-patches-info"> {{ t('n-missing', missingPatches.length) }}</span>
        </template>
      </UiCardTitle>
    </div>
    <VtsStateHero v-if="!areHostMissingPatchesReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="noMissingPatches" format="card" type="all-done" size="extra-small" horizontal>
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
import { useXoHostMissingPatchesCollection } from '@/remote-resources/use-xo-host-missing-patches-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import type { XoHost } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { hostMissingPatches: missingPatches, areHostMissingPatchesReady } = useXoHostMissingPatchesCollection(
  {},
  () => host.id
)

const nMissingPatches = computed(() => missingPatches.value.length)

const noMissingPatches = computed(() => nMissingPatches.value === 0)
</script>

<style lang="postcss" scoped>
.host-dashboard-patches {
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
