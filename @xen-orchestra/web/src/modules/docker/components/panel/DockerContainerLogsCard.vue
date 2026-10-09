<template>
  <UiPanelCard class="docker-container-logs-card">
    <UiCardTitle>{{ t('logs') }}</UiCardTitle>
    <VtsStateHero v-if="hasDockerContainerLogsError" format="card" type="error" size="extra-small">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="!areDockerContainerLogsReady" format="card" type="busy" size="extra-small" />
    <VtsStateHero v-else-if="content === ''" format="card" type="no-data" size="extra-small">
      {{ t('no-log-available') }}
    </VtsStateHero>
    <UiLogEntryViewer
      v-else
      :label="t('logs-last-n-lines', { n: DOCKER_LOGS_TAIL })"
      :content
      size="small"
      :accent="dockerContainerLogs?.timedOut ? 'warning' : 'info'"
      auto-scroll
    />
    <UiInfo v-if="dockerContainerLogs?.timedOut" accent="warning" wrap class="notice">
      {{ t('logs-timed-out') }}
    </UiInfo>
    <UiInfo v-else-if="dockerContainerLogs?.truncated" accent="warning" wrap class="notice">
      {{ t('logs-truncated') }}
    </UiInfo>
    <UiInfo accent="info" wrap>{{ t('logs-read-only-info', { n: DOCKER_LOGS_POLLING_INTERVAL_MS / 1e3 }) }}</UiInfo>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import {
  DOCKER_LOGS_POLLING_INTERVAL_MS,
  DOCKER_LOGS_TAIL,
  useXoDockerContainerLogs,
} from '@/modules/docker/remote-resources/use-xo-docker-container-logs.ts'
import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import { formatDockerLogEntries } from '@/modules/docker/utils/xo-docker.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { container } = defineProps<{
  container: FrontXoDockerContainer
}>()

const { t, d } = useI18n()

const { dockerContainerLogs, areDockerContainerLogsReady, hasDockerContainerLogsError } = useXoDockerContainerLogs(
  {},
  () => container.id
)

// local time like the other dates, with the seconds
const content = computed(() =>
  formatDockerLogEntries(dockerContainerLogs.value?.entries ?? [], date =>
    d(date, { key: 'datetime_short', second: '2-digit' })
  )
)
</script>

<style lang="postcss" scoped>
.docker-container-logs-card {
  .notice {
    margin-block-start: -0.4rem;
  }
}
</style>
