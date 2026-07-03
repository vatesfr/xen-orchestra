<template>
  <div class="vdis" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <VdisTable :vdis />
    </UiCard>

    <VdiSidePanel v-if="selectedVdi" :vdi="selectedVdi" @close="selectedVdi = undefined" />
    <UiPanel v-else-if="!uiStore.isSmall">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VdiSidePanel from '@/modules/vdi/components/list/panel/VdiSidePanel.vue'
import VdisTable from '@/modules/vdi/components/list/VdisTable.vue'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const { useGetVdisByIds } = useXoVdiCollection()

const vdis = useGetVdisByIds(() => sr.VDIs as FrontXoVdi['id'][])

const selectedVdi = useRouteQuery<FrontXoVdi | undefined>('id', {
  toData: id => vdis.value.find(vdi => vdi.id === id),
  toQuery: vdi => vdi?.id ?? '',
})
</script>

<style scoped lang="postcss">
.vdis {
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
