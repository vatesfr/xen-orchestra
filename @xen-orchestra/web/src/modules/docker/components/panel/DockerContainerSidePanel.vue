<template>
  <VtsSidePanel :has-selection="!!container" class="docker-container-side-panel" @close="emit('close')">
    <template v-if="container" #actions>
      <DockerContainerPrimaryActionButton :container @changed="emit('changed')" />
    </template>
    <template v-if="container" #more-actions>
      <DockerContainerActions :container @changed="emit('changed')" />
    </template>
    <template v-if="container" #default>
      <UiPanelCard>
        <VtsCardObjectTitle :id="container.dockerId" :label="displayName" icon="fa:layer-group" />
        <div class="content">
          <!-- CONTAINER ID -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('container-id') }}</template>
            <template #value>
              <VtsCodeSnippet :content="shortContainerId(container.dockerId)" />
            </template>
            <template #addons>
              <VtsCopyButton :value="container.dockerId" />
            </template>
          </VtsCardRowKeyValue>
          <!-- STATE -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('state') }}</template>
            <template #value>
              <UiTag :accent="getContainerStateAccent(container)" variant="primary">
                {{ getDockerContainerStateLabel(container) }}
              </UiTag>
            </template>
          </VtsCardRowKeyValue>
          <!-- HEALTH -->
          <VtsCardRowKeyValue v-if="container.health !== undefined">
            <template #key>{{ t('health') }}</template>
            <template #value>
              <div class="health">
                <UiTag :accent="healthAccent" variant="secondary">{{ t(`status:${container.health}`) }}</UiTag>
                <span v-if="container.healthCheck?.lastCheckAt !== undefined" class="muted">
                  {{ t('health-last-check') }}
                  <VtsRelativeTime :date="container.healthCheck.lastCheckAt" />
                </span>
              </div>
            </template>
          </VtsCardRowKeyValue>
          <!-- UPTIME / STATUS -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('status') }}</template>
            <template #value>{{ container.status }}</template>
          </VtsCardRowKeyValue>
          <!-- IMAGE -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('image') }}</template>
            <template #value>
              <VtsCodeSnippet :content="container.image" />
            </template>
            <template #addons>
              <VtsCopyButton :value="container.image" />
            </template>
          </VtsCardRowKeyValue>
          <!-- COMMAND -->
          <VtsCardRowKeyValue truncate align-top>
            <template #key>{{ t('command') }}</template>
            <template #value>
              <code class="command">{{ container.command }}</code>
            </template>
            <template v-if="container.command" #addons>
              <VtsCopyButton :value="container.command" />
            </template>
          </VtsCardRowKeyValue>
          <!-- CREATED -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('created-on') }}</template>
            <template #value>
              <template v-if="container.createdAt !== undefined">
                {{ d(container.createdAt, 'datetime_short') }}
              </template>
            </template>
          </VtsCardRowKeyValue>
          <!-- RESTART POLICY -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('restart-policy') }}</template>
            <template #value>{{ restartPolicy }}</template>
          </VtsCardRowKeyValue>
          <!-- COMPOSE -->
          <template v-if="container.compose !== undefined">
            <VtsCardRowKeyValue>
              <template #key>{{ t('compose-project') }}</template>
              <template #value>{{ container.compose.project }}</template>
            </VtsCardRowKeyValue>
            <VtsCardRowKeyValue>
              <template #key>{{ t('compose-service') }}</template>
              <template #value>{{ container.compose.service }}</template>
            </VtsCardRowKeyValue>
          </template>
          <!-- STATS -->
          <template v-if="container.stats !== undefined">
            <VtsCardRowKeyValue>
              <template #key>{{ t('cpu') }}</template>
              <template #value>{{ cpuUsage }}</template>
            </VtsCardRowKeyValue>
            <VtsCardRowKeyValue>
              <template #key>{{ t('memory') }}</template>
              <template #value>{{ memoryUsage }}</template>
            </VtsCardRowKeyValue>
          </template>
        </div>
      </UiPanelCard>
      <UiPanelCard>
        <UiCardTitle>{{ t('network-information') }}</UiCardTitle>
        <div class="content">
          <!-- OPEN PUBLISHED PORT -->
          <div v-if="portToOpen !== undefined">
            <UiLink
              v-tooltip="t('open-published-port-info')"
              size="medium"
              :href="portToOpen.url"
              target="_blank"
              rel="noopener noreferrer"
              class="open-port"
            >
              {{ t('open-published-port', { port: portToOpen.port.publicPort }) }}
            </UiLink>
          </div>
          <!-- PORTS -->
          <template v-if="ports.length > 0">
            <VtsCardRowKeyValue v-for="(port, index) of ports" :key="port">
              <template #key>
                <span v-if="index === 0">{{ t('ports') }}</span>
              </template>
              <template #value>{{ port }}</template>
            </VtsCardRowKeyValue>
          </template>
          <VtsCardRowKeyValue v-else>
            <template #key>{{ t('ports') }}</template>
            <template #value><span class="value" /></template>
          </VtsCardRowKeyValue>
          <!-- NETWORKS -->
          <template v-if="container.networks.length > 0">
            <VtsCardRowKeyValue v-for="(network, index) of container.networks" :key="network.name">
              <template #key>
                <span v-if="index === 0">{{ t('networks') }}</span>
              </template>
              <template #value>
                {{ network.name }}
                <span v-if="network.ipAddress" class="muted">{{ network.ipAddress }}</span>
              </template>
              <template v-if="network.ipAddress" #addons>
                <VtsCopyButton :value="network.ipAddress" />
              </template>
            </VtsCardRowKeyValue>
          </template>
          <VtsCardRowKeyValue v-else>
            <template #key>{{ t('networks') }}</template>
            <template #value><span class="value" /></template>
          </VtsCardRowKeyValue>
          <!-- VOLUMES -->
          <template v-if="container.mounts.length > 0">
            <VtsCardRowKeyValue v-for="(mount, index) of container.mounts" :key="mount.destination" align-top>
              <template #key>
                <span v-if="index === 0">{{ t('volumes') }}</span>
              </template>
              <template #value>
                <span class="mount">
                  {{ t('docker-mount', { source: mount.name ?? mount.source, destination: mount.destination }) }}
                  <span v-if="mount.readOnly" class="muted">{{ t('read-only') }}</span>
                </span>
              </template>
            </VtsCardRowKeyValue>
          </template>
          <VtsCardRowKeyValue v-else>
            <template #key>{{ t('volumes') }}</template>
            <template #value><span class="value" /></template>
          </VtsCardRowKeyValue>
        </div>
      </UiPanelCard>
      <!-- mounted only with a selection: its resource registers the URL of the container -->
      <DockerContainerLogsCard :key="container.id" :container />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import DockerContainerActions from '@/modules/docker/components/actions/DockerContainerActions.vue'
import DockerContainerPrimaryActionButton from '@/modules/docker/components/actions/DockerContainerPrimaryActionButton.vue'
import DockerContainerLogsCard from '@/modules/docker/components/panel/DockerContainerLogsCard.vue'
import { useDockerContainerStateLabel } from '@/modules/docker/composables/use-docker-container-state-label.composable.ts'
import type { FrontXoDockerContainer, FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'
import {
  dedupePorts,
  formatPortMapping,
  getContainerDisplayName,
  getContainerStateAccent,
  getPublishedPortToOpen,
  shortContainerId,
} from '@/modules/docker/utils/xo-docker.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { container, engine, vm } = defineProps<{
  container?: FrontXoDockerContainer
  engine: FrontXoDockerEngine
  vm: FrontXoVm
}>()

const emit = defineEmits<{
  close: []
  /** an action ran: the containers and the engine info must be fetched again */
  changed: []
}>()

const { t, d, n } = useI18n()

const { getDockerContainerStateLabel } = useDockerContainerStateLabel()

const displayName = computed(() => (container === undefined ? '' : getContainerDisplayName(container)))

const healthAccent = computed<TagAccent>(() => {
  switch (container?.health) {
    case 'healthy':
      return 'success'
    case 'unhealthy':
      return 'danger'
    default:
      return 'info'
  }
})

const restartPolicy = computed(() => {
  const policy = container?.restartPolicy

  if (policy === undefined) {
    return ''
  }

  return policy.name === 'on-failure' && policy.maximumRetryCount > 0
    ? `${policy.name}:${policy.maximumRetryCount}`
    : policy.name
})

const cpuUsage = computed(() => {
  const stats = container?.stats

  if (stats?.cpuPercent === undefined || stats.cpuPercent === null) {
    return '-'
  }

  const usage = n(stats.cpuPercent / 100, 'percent')

  return stats.onlineCpus === undefined ? usage : t('docker-cpu-usage-of-n-cpus', { usage, n: stats.onlineCpus })
})

const memoryUsage = computed(() => {
  const stats = container?.stats

  if (stats?.memoryUsage === undefined || stats.memoryUsage === null) {
    return '-'
  }

  return stats.memoryLimit === null || stats.memoryLimit === undefined
    ? formatSize(stats.memoryUsage, 1)
    : `${formatSize(stats.memoryUsage, 1)} / ${formatSize(stats.memoryLimit, 1)}`
})

const ports = computed(() => (container === undefined ? [] : dedupePorts(container.ports).map(formatPortMapping)))

// the link opens from the browser: the address of the engine, as XO reaches it
const portToOpen = computed(() =>
  container === undefined
    ? undefined
    : getPublishedPortToOpen(container.ports, engine.host ?? engine.resolvedHost ?? vm.mainIpAddress)
)
</script>

<style lang="postcss" scoped>
.docker-container-side-panel {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .health {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
  }

  .muted {
    color: var(--color-neutral-txt-secondary);
    margin-inline-start: 0.4rem;
  }

  .mount {
    overflow-wrap: anywhere;
  }

  .command {
    font-family: 'Courier New', Courier, monospace;
    overflow-wrap: anywhere;
  }

  .value:empty::before {
    content: '-';
  }
}
</style>
