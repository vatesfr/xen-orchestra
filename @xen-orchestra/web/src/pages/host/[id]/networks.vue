<template>
  <VtsContentSidePanel class="networks">
    <UiCard class="container">
      <PifsTable :pifs>
        <template #title-actions>
          <HostScanPifsButton :host />
        </template>
      </PifsTable>
    </UiCard>
    <PifSidePanel :pif="selectedPif" @close="selectedPif = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import HostScanPifsButton from '@/modules/host/components/actions/scan-pifs/HostScanPifsButton.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import PifSidePanel from '@/modules/pif/components/list/panel/PifSidePanel.vue'
import PifsTable from '@/modules/pif/components/list/PifsTable.vue'
import { useXoPifCollection, type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { computed } from 'vue'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { pifsByHost } = useXoPifCollection()

const pifs = computed(() => pifsByHost.value.get(host.id) ?? [])

const selectedPif = useRouteQuery<FrontXoPif | undefined>('id', {
  toData: id => pifs.value.find(pif => pif.id === id),
  toQuery: pif => pif?.id ?? '',
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
