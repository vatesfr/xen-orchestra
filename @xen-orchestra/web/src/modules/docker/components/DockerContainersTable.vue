<!-- F1 placeholder: the column set, the side panel and the actions come in F2 -->
<template>
  <div class="docker-containers-table">
    <UiTitle>{{ t('containers') }}</UiTitle>
    <VtsStateHero v-if="hasError" format="card" type="error" size="small">
      {{ t('docker-unreachable') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="!isReady" format="card" type="busy" size="small" />
    <VtsStateHero v-else-if="containers.length === 0" format="card" type="no-data" size="small">
      {{ t('no-container-detected') }}
    </VtsStateHero>
    <ul v-else class="list">
      <li v-for="container of containers" :key="container.id" class="container">
        <div class="name">
          <span class="typo-body-bold">{{ container.name ?? shortContainerId(container.dockerId) }}</span>
          <span class="id typo-body-regular-small">{{ shortContainerId(container.dockerId) }}</span>
        </div>
        <UiTag :accent="getStateAccent(container)" variant="primary" class="state">
          {{ getStateLabel(container) }}
        </UiTag>
        <code class="image typo-body-regular-small">{{ container.image }}</code>
        <div class="ports">
          <UiTag
            v-for="port of dedupePorts(container.ports)"
            :key="formatPortMapping(port)"
            accent="info"
            variant="secondary"
          >
            {{ formatPortMapping(port) }}
          </UiTag>
        </div>
        <span class="status typo-body-regular-small">{{ container.status }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import { dedupePorts, formatPortMapping, shortContainerId } from '@/modules/docker/utils/xo-docker.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  containers: FrontXoDockerContainer[]
  isReady: boolean
  hasError?: boolean
}>()

const { t } = useI18n()

function getStateAccent({ state, health }: FrontXoDockerContainer): TagAccent {
  switch (state) {
    case 'running':
      return health === 'unhealthy' ? 'warning' : 'success'
    case 'exited':
    case 'dead':
      return 'danger'
    case 'paused':
    case 'restarting':
      return 'warning'
    default:
      return 'muted'
  }
}

function getStateLabel({ state, exitCode, health }: FrontXoDockerContainer): string {
  switch (state) {
    case 'running':
      return health === undefined ? t('status:running') : `${t('status:running')} (${t(`status:${health}`)})`
    case 'exited':
      return exitCode === undefined ? t('status:exited') : t('status:exited-with-code', { code: exitCode })
    case 'paused':
      return t('status:paused')
    default:
      return state
  }
}
</script>

<style lang="postcss" scoped>
.docker-containers-table {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .list {
    display: flex;
    flex-direction: column;
    list-style: none;
  }

  .container {
    display: grid;
    grid-template-columns: minmax(14rem, 1.2fr) minmax(12rem, 1fr) minmax(12rem, 1fr) minmax(10rem, 1fr) minmax(
        14rem,
        1fr
      );
    align-items: center;
    gap: 1.6rem;
    padding-block: 0.8rem;
    border-block-end: 0.1rem solid var(--color-neutral-border);

    @media (--small) {
      grid-template-columns: 1fr auto;
    }
  }

  .name {
    display: flex;
    flex-direction: column;
    min-width: 0;

    .id {
      color: var(--color-neutral-txt-secondary);
      font-family: monospace;
    }
  }

  .state {
    justify-self: start;
  }

  .image {
    font-family: monospace;
    overflow-wrap: anywhere;
  }

  .ports {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .status {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
