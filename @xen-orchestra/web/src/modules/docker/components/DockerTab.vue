<template>
  <div class="docker-tab">
    <VtsStateHero v-if="!areDockerEnginesReady && !hasDockerEngineFetchError" format="page" type="busy" size="large" />
    <VtsStateHero v-else-if="hasDockerEngineFetchError" format="page" type="error" size="large">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="!isVmRunning" format="page" type="offline" size="large" horizontal>
      <span>{{ t('all-quiet-launchpad') }}</span>
      <span class="title typo-h1">{{ t('vm-shutdown') }}</span>
      <div class="description typo-body-bold">
        <span>{{ t('vm-off') }}</span>
        <span>{{ t('docker-start-vm') }}</span>
      </div>
    </VtsStateHero>
    <div v-else-if="dockerEngine === undefined" class="content">
      <DockerConnectionForm :vm @saved="reloadDockerEngines()" />
    </div>
    <DockerEngineView
      v-else
      :key="dockerEngine.id"
      :vm
      :engine="dockerEngine"
      @saved="reloadDockerEngines()"
      @deleted="reloadDockerEngines()"
    />
  </div>
</template>

<script lang="ts" setup>
import DockerEngineView from '@/modules/docker/components/DockerEngineView.vue'
import DockerConnectionForm from '@/modules/docker/components/form/connection/DockerConnectionForm.vue'
import { useXoDockerEngineCollection } from '@/modules/docker/remote-resources/use-xo-docker-engine-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { VM_POWER_STATE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

// no SSH: reading the engines only reads their records
const { dockerEngine, areDockerEnginesReady, hasDockerEngineFetchError, reloadDockerEngines } =
  useXoDockerEngineCollection({}, () => `$VM:${vm.id}`)

const isVmRunning = computed(() => vm.power_state === VM_POWER_STATE.RUNNING)
</script>

<style lang="postcss" scoped>
.docker-tab {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  .content {
    margin: 0.8rem;
  }

  .title {
    color: var(--color-neutral-txt-primary);
  }

  .description {
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
