<template>
  <VtsSidePanel :has-selection="!!server" @close="emit('close')">
    <template v-if="server" #actions>
      <PoolConnectionToggleButton :server-id="server.id" />
      <PoolDownloadButton v-if="server.poolId !== undefined" :pool-id="server.poolId" />
      <PoolForgetButton :server />
    </template>
    <template v-if="server">
      <VtsStateHero v-if="!arePoolsReady" format="panel" type="busy" size="medium" />
      <template v-else>
        <UiAlert v-if="server.error !== undefined" accent="danger">
          {{ t('connection-failed') }}
          <template #description>
            {{ t('unable-to-connect-to-the-pool') }}
          </template>
        </UiAlert>
        <UiPanelCard v-if="poolInfo?.label">
          <UiPanelCardTitle
            :id="server.poolId"
            size="medium"
            :label="poolInfo.label"
            :to="poolInfo.to"
            :icon="poolInfo.icon"
            :disabled="!isConnected"
          />
          <VtsCardRowList>
            <!-- Description -->
            <VtsCardRowKeyValue truncate align-top>
              <template #key>{{ t('description') }}</template>
              <template #value>{{ server.poolNameDescription }}</template>
              <template v-if="server.poolNameDescription !== undefined" #addons>
                <VtsCopyButton :value="server.poolNameDescription" />
              </template>
            </VtsCardRowKeyValue>
            <!-- tag -->
            <VtsCardRowKeyValue>
              <template #key>{{ t('tags') }}</template>
              <template #value>
                <UiTagsList v-if="pool !== undefined && pool.tags.length > 0">
                  <VtsTag v-for="tag in pool.tags" :key="tag" :value="tag" />
                </UiTagsList>
              </template>
              <template v-if="pool !== undefined && pool.tags.length > 0" #addons>
                <VtsCopyButton :value="pool.tags.join(', ')" />
              </template>
            </VtsCardRowKeyValue>
          </VtsCardRowList>
        </UiPanelCard>
        <UiPanelCard>
          <UiPanelCardTitle size="medium" :label="t('connection')" />
          <VtsCardRowList>
            <!-- status -->
            <VtsCardRowKeyValue>
              <template #key>{{ t('status') }}</template>
              <template #value>
                <UiInfo :accent="connectionStatus.accent">
                  {{ connectionStatus.text }}
                </UiInfo>
              </template>
            </VtsCardRowKeyValue>
            <!-- primary-host -->
            <VtsCardRowKeyValue>
              <template #key>{{ t('master') }}</template>
              <template #value>
                <HostLink v-if="primaryHost !== undefined" :host="primaryHost" size="small" />
              </template>
              <template v-if="primaryHost !== undefined" #addons>
                <VtsCopyButton :value="primaryHost.id" />
              </template>
            </VtsCardRowKeyValue>
            <!-- ip-address -->
            <VtsCardRowKeyValue>
              <template #key>{{ t('ip-address') }}</template>
              <template #value>{{ server.host }}</template>
              <template #addons>
                <VtsCopyButton :value="server.host" />
              </template>
            </VtsCardRowKeyValue>
            <!-- proxy-url -->
            <VtsCardRowKeyValue>
              <template #key>{{ t('proxy-url') }}</template>
              <template #value>{{ server.httpProxy }}</template>
              <template v-if="server.httpProxy !== undefined" #addons>
                <VtsCopyButton :value="server.httpProxy" />
              </template>
            </VtsCardRowKeyValue>
            <!-- username -->
            <VtsCardRowKeyValue>
              <template #key>{{ t('username') }}</template>
              <template #value>{{ server.username }}</template>
              <template #addons>
                <VtsCopyButton :value="server.username" />
              </template>
            </VtsCardRowKeyValue>
            <!-- read-only -->
            <VtsCardRowKeyValue>
              <template #key>{{ t('read-only') }}</template>
              <template #value>
                <VtsStatus :status="server.readOnly" />
              </template>
            </VtsCardRowKeyValue>
            <!-- self-signed-certificates -->
            <VtsCardRowKeyValue>
              <template #key>{{ t('self-signed-certificates') }}</template>
              <template #value>
                <!-- todo add information button. waiting modal -->
                <VtsStatus :status="server.allowUnauthorized" />
              </template>
            </VtsCardRowKeyValue>
          </VtsCardRowList>
        </UiPanelCard>
        <UiPanelCard v-if="hosts !== undefined">
          <UiPanelCardTitle size="medium" :label="t('hosts')" :counter="hosts.length" />
          <VtsStateHero v-if="hosts.length === 0" format="card" type="no-data" size="small">
            {{ t('no-data') }}
          </VtsStateHero>
          <template v-else>
            <HostLink v-for="host in hosts" :key="host.id" :host="host" size="small" />
          </template>
        </UiPanelCard>
        <UiPanelCard v-if="server.error">
          <UiPanelCardTitle size="medium" :label="t('error')" :counter="{ value: 1, accent: 'danger' }" />
          <UiLogEntryViewer accent="danger" :label="t('api-error-details')" size="small" :content="server.error" />
        </UiPanelCard>
      </template>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import HostLink from '@/modules/host/components/HostLink.vue'
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import PoolConnectionToggleButton from '@/modules/pool/components/actions/connection/PoolConnectionToggleButton.vue'
import PoolDownloadButton from '@/modules/pool/components/actions/download/PoolDownloadButton.vue'
import PoolForgetButton from '@/modules/pool/components/actions/forget/PoolForgetButton.vue'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { getPoolInfo } from '@/modules/pool/utils/xo-pool.util.ts'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useMapper } from '@core/packages/mapper'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { server } = defineProps<{
  server?: FrontXoServer
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const { arePoolsReady, useGetPoolById } = useXoPoolCollection()
const { useGetHostById, hostsByPool } = useXoHostCollection()

const pool = useGetPoolById(() => server?.poolId)
const primaryHost = useGetHostById(() => server?.master)
const hosts = computed(() => (server?.poolId ? hostsByPool.value.get(server.poolId) : undefined))

const poolInfo = computed(() => (server ? getPoolInfo(server) : undefined))

const connectionState = computed(() => (server ? (server.error ? 'error' : server.status) : 'error'))

const isConnected = computed(() => connectionState.value === 'connected')

const connectionStatus = useMapper(
  connectionState,
  {
    error: { accent: 'danger', text: t('unable-to-connect-to-the-pool') },
    disconnected: { accent: 'muted', text: t('disconnected') },
    disconnecting: { accent: 'info', text: t('disconnecting') }, // TODO: fix when designed
    connected: { accent: 'success', text: t('connected') },
    connecting: { accent: 'info', text: t('connecting') },
  },
  'error'
)
</script>
