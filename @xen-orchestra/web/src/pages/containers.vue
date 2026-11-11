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
    <ContainerHostsTable :hosts :busy="!isReady" :error="hasDockerEngineFetchError" />
  </UiCard>
</template>

<script lang="ts" setup>
import ContainerHostsTable from '@/modules/docker/components/list/ContainerHostsTable.vue'
import { useDockerCapability } from '@/modules/docker/composables/use-docker-capability.composable.ts'
import { useXoDockerEngineCollection } from '@/modules/docker/remote-resources/use-xo-docker-engine-collection.ts'
import { getDockerTreeHosts } from '@/modules/docker/utils/xo-docker-tree.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// reading the engines never connects
const { dockerEngines, areDockerEnginesReady, hasDockerEngineFetchError, lastDockerEngineFetchError } =
  useXoDockerEngineCollection({}, '')

const { getVmById, areVmsReady } = useXoVmCollection()

const { isDockerUnavailableWithPlan } = useDockerCapability(lastDockerEngineFetchError)

const isReady = logicAnd(areDockerEnginesReady, areVmsReady)

const hosts = computed(() => getDockerTreeHosts(dockerEngines.value, getVmById))
</script>

<style lang="postcss" scoped>
.containers {
  height: fit-content;
  margin: 0.8rem;
}
</style>
