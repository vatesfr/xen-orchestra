<template>
  <div class="docker-containers-table">
    <UiTitle>{{ t('containers') }}</UiTitle>
    <UiAlert
      v-if="dockerContainerActionError !== undefined"
      accent="danger"
      close
      class="action-error"
      @close="clearDockerContainerActionError()"
    >
      {{
        t('docker-container-action-failed', {
          action: dockerContainerActionError.action,
          name: dockerContainerActionError.containerName,
        })
      }}
      <template #description>{{ dockerContainerActionError.message }}</template>
    </UiAlert>
    <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
    <VtsTable :state :pagination-bindings sticky="right">
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="container of paginatedContainers" :key="container.id" :selected="selectedId === container.id">
          <BodyCells :item="container" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import { useDockerContainerActionError } from '@/modules/docker/composables/use-docker-container-action-error.composable.ts'
import { useDockerContainerActions } from '@/modules/docker/composables/use-docker-container-actions.composable.ts'
import { useDockerContainerStateLabel } from '@/modules/docker/composables/use-docker-container-state-label.composable.ts'
import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import {
  dedupePorts,
  formatPortMapping,
  getContainerDisplayName,
  getContainerStateAccent,
  shortContainerId,
} from '@/modules/docker/utils/xo-docker.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useDockerContainerColumns } from '@core/tables/column-sets/docker-container-columns.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { renderLoadingCell } from '@core/tables/helpers/render-loading-cell.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { containers, isReady, hasError } = defineProps<{
  containers: FrontXoDockerContainer[]
  isReady: boolean
  hasError?: boolean
}>()

const emit = defineEmits<{
  /** an action ran: the containers and the engine info must be fetched again */
  changed: []
}>()

const { t } = useI18n()

const selectedId = useRouteQuery('id')

const { dockerContainerActionError, clearDockerContainerActionError } = useDockerContainerActionError()

const { getDockerContainerStateLabel } = useDockerContainerStateLabel()

const searchQuery = ref('')

function getSearchableValues(container: FrontXoDockerContainer): string[] {
  return [
    container.name ?? '',
    container.dockerId,
    container.image,
    container.state,
    container.status ?? '',
    getDockerContainerStateLabel(container),
    container.compose?.project ?? '',
    container.compose?.service ?? '',
    ...container.ports.map(formatPortMapping),
    ...Object.entries(container.labels ?? {}).flat(),
  ]
}

const filteredContainers = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (searchTerm === '') {
    return containers
  }

  return containers.filter(container =>
    getSearchableValues(container).some(value => value.toLocaleLowerCase().includes(searchTerm))
  )
})

const state = useTableState({
  busy: () => !isReady && !hasError,
  error: () => (hasError ? t('docker-unreachable') : false),
  empty: () =>
    containers.length === 0
      ? t('no-container-detected')
      : filteredContainers.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { pageRecords: paginatedContainers, paginationBindings } = usePagination('docker-containers', filteredContainers)

const { HeadCells, BodyCells } = useDockerContainerColumns({
  body: (container: FrontXoDockerContainer) => {
    const { dockerContainerActionItems } = useDockerContainerActions(() => container, {
      onSettled: () => emit('changed'),
    })

    // running and paused containers only, `statsPending` while the sampler warms up
    const stats = computed(() => container.stats)

    const isStatsPending = computed(
      () => container.statsPending === true && (stats.value === undefined || stats.value.cpuPercent === null)
    )

    const memory = computed(() => {
      const usage = stats.value?.memoryUsage

      return usage === undefined || usage === null ? undefined : formatSizeRaw(usage, 1)
    })

    const isUp = computed(() => container.state === 'running' || container.state === 'paused')

    return {
      name: r => r(getContainerDisplayName(container), shortContainerId(container.dockerId)),
      state: r => r(getDockerContainerStateLabel(container), getContainerStateAccent(container)),
      image: r => r(container.image),
      ports: r => r(dedupePorts(container.ports).map(formatPortMapping)),
      cpu: r => {
        const cpuPercent = stats.value?.cpuPercent

        if (cpuPercent === undefined || cpuPercent === null) {
          return isStatsPending.value ? renderLoadingCell() : renderBodyCell()
        }

        // `docker stats` semantics: 100 is one full CPU, `n(…, 'percent')` expects a ratio
        return r(cpuPercent / 100)
      },
      memory: r => {
        if (memory.value === undefined) {
          return isStatsPending.value && stats.value === undefined ? renderLoadingCell() : renderBodyCell()
        }

        return r(memory.value.value, memory.value.prefix)
      },
      uptime: r => r(isUp.value ? container.startedAt : undefined, { relative: true }),
      actions: r =>
        r({
          onClick: () => (selectedId.value = container.id),
          actions: dockerContainerActionItems.value,
        }),
    }
  },
})
</script>

<style lang="postcss" scoped>
.docker-containers-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
