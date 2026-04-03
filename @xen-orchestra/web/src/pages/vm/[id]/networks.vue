<template>
  <div class="networks" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <VifsTable :vifs>
        <template #title-actions>
          <UiLink size="medium" :to="{ name: '/vif/new', query: { vmId: vm.id } }" icon="fa:plus">
            {{ t('new-vif') }}
          </UiLink>
        </template>
      </VifsTable>
    </UiCard>
    <VifSidePanel v-if="selectedVif" :vif="selectedVif" @close="selectedVif = undefined" />
    <UiPanel v-else-if="!uiStore.isSmall">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import VifSidePanel from '@/modules/vif/components/panel/VifSidePanel.vue'
import VifsTable from '@/modules/vif/components/VifsTable.vue'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useArrayFilter } from '@vueuse/shared'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { vifs: rawVifs, getVifById } = useXoVifCollection()

const uiStore = useUiStore()

const { t } = useI18n()

const vifs = useArrayFilter(rawVifs, vif => vif.$VM === vm.id)

const selectedVif = useRouteQuery<FrontXoVif | undefined>('id', {
  toData: id => getVifById(id as FrontXoVif['id']),
  toQuery: vif => vif?.id ?? '',
})
</script>

<style scoped lang="postcss">
.networks {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
