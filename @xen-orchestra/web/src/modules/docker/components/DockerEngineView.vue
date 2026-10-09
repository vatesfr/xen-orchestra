<!--
 The configured layout: mounted only when the VM has an engine, so that the
parameterized resources never register a URL without an engine id 
-->
<template>
  <VtsStateHero v-if="!isDockerEngineInfoReady && !hasDockerEngineInfoError" format="page" type="busy" size="large" />
  <div v-else-if="isEditing" class="content">
    <DockerConnectionForm :vm :engine @saved="onSaved()" @cancel="isEditing = false" />
  </div>
  <VtsContentSidePanel v-else class="docker-engine-view">
    <div class="content">
      <VtsColumns>
        <VtsColumn>
          <DockerEngineCard
            :engine
            :info="hasDockerEngineInfoError ? undefined : dockerEngineInfo"
            :has-info-error="hasDockerEngineInfoError"
            @configure="isEditing = true"
            @refresh="refresh()"
            @deleted="emit('deleted')"
          />
        </VtsColumn>
        <VtsColumn>
          <DockerContainersSummaryCard :summary="dockerContainersSummary" :has-error="!isConnected" />
        </VtsColumn>
      </VtsColumns>
      <UiCard class="container">
        <DockerContainersTable
          :containers="isConnected ? dockerContainers : []"
          :is-ready="areDockerContainersReady"
          :has-error="!isConnected || hasDockerContainerFetchError"
          @changed="refresh()"
        />
      </UiCard>
    </div>
    <DockerContainerSidePanel
      :container="selectedContainer"
      :engine
      :vm
      @close="selectedContainer = undefined"
      @changed="refresh()"
    />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import DockerContainersSummaryCard from '@/modules/docker/components/DockerContainersSummaryCard.vue'
import DockerContainersTable from '@/modules/docker/components/DockerContainersTable.vue'
import DockerEngineCard from '@/modules/docker/components/DockerEngineCard.vue'
import DockerConnectionForm from '@/modules/docker/components/form/connection/DockerConnectionForm.vue'
import DockerContainerSidePanel from '@/modules/docker/components/panel/DockerContainerSidePanel.vue'
import { useDockerContainerActionError } from '@/modules/docker/composables/use-docker-container-action-error.composable.ts'
import { useXoDockerContainerCollection } from '@/modules/docker/remote-resources/use-xo-docker-container-collection.ts'
import { useXoDockerEngineInfo } from '@/modules/docker/remote-resources/use-xo-docker-engine-info.ts'
import type { FrontXoDockerContainer, FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { computed, onBeforeUnmount, ref } from 'vue'

const { engine } = defineProps<{
  vm: FrontXoVm
  engine: FrontXoDockerEngine
}>()

const emit = defineEmits<{
  saved: []
  deleted: []
}>()

const { dockerEngineInfo, isDockerEngineInfoReady, hasDockerEngineInfoError, reloadDockerEngineInfo } =
  useXoDockerEngineInfo({}, () => engine.id)

const {
  dockerContainers,
  dockerContainersSummary,
  areDockerContainersReady,
  hasDockerContainerFetchError,
  reloadDockerContainers,
  getDockerContainerById,
} = useXoDockerContainerCollection({}, () => engine.id)

const { clearDockerContainerActionError } = useDockerContainerActionError()

onBeforeUnmount(() => clearDockerContainerActionError())

// the engine record tells when the pooled connection failed since, e.g. while listing the containers
const isConnected = computed(
  () =>
    !hasDockerEngineInfoError.value &&
    dockerEngineInfo.value?.status === 'connected' &&
    engine.connectionStatus !== 'error'
)

const selectedContainer = useRouteQuery<FrontXoDockerContainer | undefined>('id', {
  toData: id => (isConnected.value ? getDockerContainerById(id as FrontXoDockerContainer['id']) : undefined),
  toQuery: container => container?.id ?? '',
})

const isEditing = ref(false)

function refresh() {
  reloadDockerEngineInfo()
  reloadDockerContainers()
}

function onSaved() {
  isEditing.value = false
  refresh()
  emit('saved')
}
</script>

<style lang="postcss" scoped>
.content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;
}
</style>
