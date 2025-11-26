<template>
  <div class="hosts" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <HostsTable :hosts :host-ready="areHostsReady" :has-error="hasHostFetchError" />
    </UiCard>
    <HostsSidePanel v-if="selectedHost" :host="selectedHost" @close="selectedHost = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script lang="ts" setup>
import HostsTable from '@/components/hosts/HostsTable.vue'
import HostsSidePanel from '@/components/hosts/panel/HostsSidePanel.vue'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store'
import type { XoHost, XoPool } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPool
}>()

const uiStore = useUiStore()

const { t } = useI18n()

const { areHostsReady, hostsByPool, hasHostFetchError } = useXoHostCollection()

const hosts = computed(() => hostsByPool.value.get(pool.id) ?? [])

const selectedHost = useRouteQuery<XoHost | undefined>('id', {
  toData: id => hosts.value.find(host => host.id === id),
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
