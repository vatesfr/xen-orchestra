<template>
  <VtsContentSidePanel class="network">
    <UiCard class="container">
      <VifsTable v-if="vm" :vifs :vm>
        <template #title-actions>
          <UiLink size="medium" :to="{ name: '/vif/new', query: { vmUuid: vm.uuid } }" icon="fa:plus">
            {{ t('new-vif') }}
          </UiLink>
        </template>
      </VifsTable>
    </UiCard>
    <VifsSidePanel :vif="selectedVif" @close="selectedVif = undefined" />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import type { XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VifsSidePanel from '@/modules/vif/components/panel/VifsSidePanel.vue'
import VifsTable from '@/modules/vif/components/VifsTable.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useVifStore } from '@/stores/xen-api/vif.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useArrayFilter } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { records } = useVifStore().subscribe()
const { getByUuid } = useVmStore().subscribe()

const route = useRoute<'/vm/[uuid]/network'>()

const { t } = useI18n()
usePageTitleStore().setTitle(t('network'))

const vm = computed(() => getByUuid(route.params.uuid as XenApiVm['uuid']))

const vifs = useArrayFilter(records, vif => vif.VM === vm.value?.$ref)

const selectedVif = useRouteQuery<XenApiVif | undefined>('id', {
  toData: id => vifs.value.find(vif => vif.uuid === id),
  toQuery: vif => vif?.uuid ?? '',
})
</script>

<style lang="postcss" scoped>
.network {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
