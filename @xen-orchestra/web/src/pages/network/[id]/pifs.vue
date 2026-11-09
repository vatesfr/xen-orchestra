<template>
  <VtsContentSidePanel class="pifs">
    <UiCard class="container">
      <PifsTable :pifs />
    </UiCard>
    <PifSidePanel :pif="selectedPif" @close="selectedPif = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import { useXoNetworkUtils } from '@/modules/network/composables/xo-network-utils.composable.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import PifSidePanel from '@/modules/pif/components/list/panel/PifSidePanel.vue'
import PifsTable from '@/modules/pif/components/list/PifsTable.vue'
import { useXoPifCollection, type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { whenever } from '@vueuse/core'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const { network } = defineProps<{
  network: FrontXoNetwork
}>()

const router = useRouter()

const { isInternalNetwork } = useXoNetworkUtils(() => network)

whenever(isInternalNetwork, () => router.replace({ name: '/network/[id]/general', params: { id: network.id } }), {
  immediate: true,
})

const { getPifsByNetworkId } = useXoPifCollection()

const pifs = computed(() => getPifsByNetworkId(network.id))

const selectedPif = useRouteQuery<FrontXoPif | undefined>('id', {
  toData: id => pifs.value.find(pif => pif.id === id),
  toQuery: pif => pif?.id ?? '',
})
</script>

<style scoped lang="postcss">
.pifs {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
