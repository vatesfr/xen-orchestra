<template>
  <VtsContentSidePanel class="networks">
    <UiCard class="container">
      <VifsTable :vifs :vm>
        <template #title-actions>
          <UiLink size="medium" :to="{ name: '/vif/new', query: { vmId: vm.id } }" icon="fa:plus">
            {{ t('new-vif') }}
          </UiLink>
        </template>
      </VifsTable>
    </UiCard>
    <VifSidePanel :vif="selectedVif" :vm @close="selectedVif = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import VifSidePanel from '@/modules/vif/components/panel/VifSidePanel.vue'
import VifsTable from '@/modules/vif/components/VifsTable.vue'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useArrayFilter } from '@vueuse/shared'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { vifs: rawVifs, getVifById } = useXoVifCollection()

const { t } = useI18n()

const vifs = useArrayFilter(rawVifs, vif => vif.$VM === vm.id)

const selectedVif = useRouteQuery<FrontXoVif | undefined>('id', {
  toData: id => getVifById(id as FrontXoVif['id']),
  toQuery: vif => vif?.id ?? '',
})
</script>

<style scoped lang="postcss">
.networks {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
