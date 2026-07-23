<template>
  <UiCard class="pool-dashboard-hosts-patches">
    <UiCardTitle>
      {{ t('patches') }}
      <template v-if="areAllLoaded && count > 0" #info>
        <span class="patches-title">
          {{ t('n-missing', { n: count }) }}
        </span>
      </template>
    </UiCardTitle>
    <div class="table-container">
      <HostPatchesTable :patches :busy="!areSomeLoaded" />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import HostPatchesTable from '@/components/HostPatchesTable.vue'
import { useHostPatches } from '@/composables/host-patches.composable'
import { useHostStore } from '@/stores/xen-api/host.store'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { records: hosts } = useHostStore().subscribe()

const { count, patches, areAllLoaded, areSomeLoaded } = useHostPatches(hosts)
</script>

<style lang="postcss" scoped>
.pool-dashboard-hosts-patches {
  min-width: 43.8rem;
}

.patches-title {
  color: var(--color-danger-txt-base);
}

.table-container {
  max-height: 25rem;
  overflow: auto;
}
</style>
