<!--
 The configured layout: mounted only when the VM has an engine, so that the
parameterized resources never register a URL without an engine id 
-->
<template>
  <VtsStateHero v-if="!isDockerEngineInfoReady && !hasDockerEngineInfoError" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="hasDockerEngineInfoError" format="page" type="error" size="large">
    {{ t('error-no-data') }}
  </VtsStateHero>
  <div v-else-if="isEditing" class="content">
    <DockerConnectionForm :vm :engine @saved="onSaved()" @cancel="isEditing = false" />
  </div>
  <div v-else class="content">
    <VtsColumns>
      <VtsColumn>
        <DockerEngineCard
          :engine
          :info="dockerEngineInfo"
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
      />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import DockerContainersSummaryCard from '@/modules/docker/components/DockerContainersSummaryCard.vue'
import DockerContainersTable from '@/modules/docker/components/DockerContainersTable.vue'
import DockerEngineCard from '@/modules/docker/components/DockerEngineCard.vue'
import DockerConnectionForm from '@/modules/docker/components/form/connection/DockerConnectionForm.vue'
import { useDockerRefresh } from '@/modules/docker/composables/use-docker-refresh.composable.ts'
import { useXoDockerContainerCollection } from '@/modules/docker/remote-resources/use-xo-docker-container-collection.ts'
import { useXoDockerEngineInfo } from '@/modules/docker/remote-resources/use-xo-docker-engine-info.ts'
import { DOCKER_STATUS, type FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { engine } = defineProps<{
  vm: FrontXoVm
  engine: FrontXoDockerEngine
}>()

const emit = defineEmits<{
  saved: []
  deleted: []
}>()

const { t } = useI18n()

const { dockerEngineInfo, isDockerEngineInfoReady, hasDockerEngineInfoError, reloadDockerEngineInfo } =
  useXoDockerEngineInfo({}, () => engine.id)

const {
  dockerContainers,
  dockerContainersSummary,
  areDockerContainersReady,
  hasDockerContainerFetchError,
  reloadDockerContainers,
} = useXoDockerContainerCollection({}, () => engine.id)

const isConnected = computed(() => dockerEngineInfo.value?.status === DOCKER_STATUS.CONNECTED)

const isEditing = ref(false)

const { refresh } = useDockerRefresh([reloadDockerEngineInfo, reloadDockerContainers])

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
