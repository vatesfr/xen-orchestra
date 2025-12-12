<template>
  <div class="networks" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <VmVifsTable :vm :vifs />
    </UiCard>
    <VmVifSidePanel v-if="selectedVif" :vif="selectedVif" @close="selectedVif = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import VmVifSidePanel from '@/components/vm/network/VmVifSidePanel.vue'
import VmVifsTable from '@/components/vm/network/VmVifsTable.vue'
import { useXoVifCollection } from '@/remote-resources/use-xo-vif-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoVif, XoVm } from '@vates/types'
import { useArrayFilter } from '@vueuse/shared'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { vifs: rawVifs, getVifById } = useXoVifCollection()
const uiStore = useUiStore()

const { t } = useI18n()

const vifs = useArrayFilter(rawVifs, vif => vif.$VM === vm.id)

const selectedVif = useRouteQuery<XoVif | undefined>('id', {
  toData: id => getVifById(id as XoVif['id']),
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
