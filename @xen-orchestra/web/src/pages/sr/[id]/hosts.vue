<template>
  <div class="hosts" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <HostsTable :hosts :busy="!areHostsReady" :error="hasHostFetchError" />
    </UiCard>
    <HostSidePanel v-if="selectedHost" :host="selectedHost" @close="selectedHost = undefined" />
    <UiPanel v-else-if="!uiStore.isSmall">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import HostsTable from '@/modules/host/components/list/HostsTable.vue'
import HostSidePanel from '@/modules/host/components/list/panel/HostSidePanel.vue'
import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const uiStore = useUiStore()

const { pbdsBySr } = useXoPbdCollection()
const { getHostById, hasHostFetchError, areHostsReady } = useXoHostCollection()

const pbds = computed(() => pbdsBySr.value.get(sr.id))

const hosts = computed(() => (pbds.value ?? []).map(pbd => getHostById(pbd.host)).filter(host => host !== undefined))
const { t } = useI18n()

const selectedHost = useRouteQuery<FrontXoHost | undefined>('id', {
  toData: id => getHostById(id as FrontXoHost['id']),
  toQuery: host => host?.id ?? '',
})
</script>

<style scoped lang="postcss">
.hosts {
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
