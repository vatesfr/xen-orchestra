<template>
  <UiHeadBar icon="object:containers">{{ t('containers') }}</UiHeadBar>
  <VtsStateHero v-if="isDockerUnavailableWithPlan" format="page" type="no-data" size="large">
    {{ t('docker-unavailable-with-plan') }}
  </VtsStateHero>
  <VtsStateHero
    v-else-if="isReady && !hasDockerEngineFetchError && hosts.length === 0"
    format="page"
    type="no-data"
    size="large"
  >
    <p>{{ t('no-container-host') }}</p>
    <p class="typo-body-regular">{{ t('container-hosts-hint') }}</p>
  </VtsStateHero>
  <UiCard v-else class="containers">
    <UiTitle>{{ t('container-hosts') }}</UiTitle>
    <VtsTable :state :pagination-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="host of pageRecords" :key="host.id">
          <BodyCells :item="host" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </UiCard>
</template>

<script lang="ts" setup>
import { useDockerCapability } from '@/modules/docker/composables/use-docker-capability.composable.ts'
import { useDockerHostStatus } from '@/modules/docker/composables/use-docker-host-status.composable.ts'
import { useXoDockerEngineCollection } from '@/modules/docker/remote-resources/use-xo-docker-engine-collection.ts'
import type { DockerTreeHost } from '@/modules/docker/types/docker.type.ts'
import {
  getDockerEngineKindLabel,
  getDockerHostIcon,
  getDockerTreeHosts,
} from '@/modules/docker/utils/xo-docker-tree.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useContainerHostColumns } from '@core/tables/column-sets/container-host-columns.ts'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// reading the engines never connects
const { dockerEngines, areDockerEnginesReady, hasDockerEngineFetchError, lastDockerEngineFetchError } =
  useXoDockerEngineCollection({}, '')

const { getVmById, areVmsReady } = useXoVmCollection()

const { isDockerUnavailableWithPlan } = useDockerCapability(lastDockerEngineFetchError)

const { getDockerHostStatus } = useDockerHostStatus()

const isReady = logicAnd(areDockerEnginesReady, areVmsReady)

const hosts = computed(() => getDockerTreeHosts(dockerEngines.value, getVmById))

const state = useTableState({
  busy: () => !isReady.value && !hasDockerEngineFetchError.value,
  error: () => hasDockerEngineFetchError.value,
})

const { pageRecords, paginationBindings } = usePagination('container-hosts', hosts)

const { HeadCells, BodyCells } = useContainerHostColumns({
  body: (host: DockerTreeHost) => {
    const status = computed(() => getDockerHostStatus(host))

    return {
      vm: r =>
        r({
          label: host.label,
          to: `/vm/${host.vm.id}/containers`,
          icon: getDockerHostIcon(host),
        }),
      type: r => r(getDockerEngineKindLabel(host.engine) ?? '-'),
      connection: r => r(status.value.label, status.value.accent),
    }
  },
})
</script>

<style lang="postcss" scoped>
.containers {
  margin: 0.8rem;
  gap: 2.4rem;
}
</style>
