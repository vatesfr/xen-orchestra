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
    <div class="table-wrapper">
      <HostPatchesTable :busy="!areHostMissingPatchesReady" :patches="missingPatches" />
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import HostPatchesTable from '@/modules/host/components/HostPatchesTable.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoHostMissingPatchesCollection } from '@/modules/host/remote-resources/use-xo-host-missing-patches-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
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

    .table {
      margin-top: -0.1rem;
    }
  }
}
</style>
