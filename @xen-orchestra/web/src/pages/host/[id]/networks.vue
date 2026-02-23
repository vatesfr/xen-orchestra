<template>
  <div class="networks" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <PifsTable :pifs>
        <template #title-actions>
          <UiLink :href="xo5ScanPifsHref" icon="fa:plus" size="medium">
            {{ t('scan-pifs-in-xo-5') }}
          </UiLink>
        </template>
      </PifsTable>
    </UiCard>
    <PifSidePanel v-if="selectedPif" :pif="selectedPif" @close="selectedPif = undefined" />
    <UiPanel v-else-if="!uiStore.isSmall">
      <VtsStateHero format="panel" type="no-selection" size="small">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import PifSidePanel from '@/modules/pif/components/list/panel/PifSidePanel.vue'
import PifsTable from '@/modules/pif/components/list/PifsTable.vue'
import { useXoPifCollection, type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { buildXo5Route } = useXoRoutes()
const xo5ScanPifsHref = computed(() => buildXo5Route(`/hosts/${host.id}/network`))

const { pifsByHost } = useXoPifCollection()
const uiStore = useUiStore()

const { t } = useI18n()

const pifs = computed(() => pifsByHost.value.get(host.id) ?? [])

const selectedPif = useRouteQuery<FrontXoPif | undefined>('id', {
  toData: id => pifs.value.find(pif => pif.id === id),
  toQuery: pif => pif?.id ?? '',
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
