<template>
  <UiCard class="pool-dashboard-hosts-patches">
    <UiCardTitle class="patches-title">
      {{ t('patches') }}
      <template v-if="areAllLoaded && count > 0" #right>
        {{ t('n-missing', { n: count }) }}
      </template>
    </UiCardTitle>
    <div class="table-container">
      <HostPatches
        :are-all-loaded="areAllLoaded"
        :are-some-loaded="areSomeLoaded"
        :has-multiple-hosts="hosts.length > 1"
        :patches
      />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import HostPatches from '@/components/HostPatchesTable.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import { useHostPatches } from '@/composables/host-patches.composable'
import { useHostStore } from '@/stores/xen-api/host.store'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { records: hosts } = useHostStore().subscribe()

const { count, patches, areSomeLoaded, areAllLoaded } = useHostPatches(hosts)
</script>

<style lang="postcss" scoped>
.pool-dashboard-hosts-patches {
  min-width: 43.8rem;
}

.patches-title {
  --section-title-right-color: var(--color-danger-txt-base);
}

.table-container {
  max-height: 25rem;
  overflow: auto;
}
</style>
