<template>
  <div class="vms" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <VmsTable :vms :busy="!areVmsReady" :error="hasVmFetchError" />
    </UiCard>
    <VmSidePanel v-if="selectedVm" :vm="selectedVm" @close="selectedVm = undefined" />
    <UiPanel v-else-if="!uiStore.isSmall">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import VmSidePanel from '@/modules/vm/components/list/panel/VmSidePanel.vue'
import VmsTable from '@/modules/vm/components/list/VmsTable.vue'
import { useXoVmCollection, type FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { vms, getVmById, areVmsReady, hasVmFetchError } = useXoVmCollection()

const uiStore = useUiStore()

const selectedVm = useRouteQuery<FrontXoVm | undefined>('id', {
  toData: id => getVmById(id as FrontXoVm['id']),
  toQuery: vm => vm?.id ?? '',
})
</script>

<style scoped lang="postcss">
.vms {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
