<template>
  <VtsSidePanel :has-selection="!!server" class="pool-side-panel" @close="emit('close')">
    <template v-if="server" #actions>
      <PoolConnectionToggleButton :server-id="server.id" />
      <MenuList placement="bottom-end">
        <template #trigger="{ open }">
          <UiButtonIcon
            v-tooltip="{ placement: 'left', content: t('more-actions') }"
            accent="brand"
            icon="action:more-actions"
            size="medium"
            @click="open($event)"
          />
        </template>
        <PoolDownloadButton v-if="server.poolId !== undefined" :pool-id="server.poolId" />
        <PoolForgetButton :server />
      </MenuList>
    </template>
    <template v-if="server">
      <VtsStateHero v-if="!arePoolsReady" format="panel" type="busy" size="medium" />
      <template v-else>
        <UiPanelCard v-if="server.error === undefined">
          <VtsCardObjectTitle :id="server.id" :label="server.label" icon="object:pool" />
          <div class="content">
            <!-- Pool -->
            <VtsCardRowKeyValue>
              <template #key>{{ t('pool') }}</template>
              <template #value>
                <UiLink
                  v-if="server.poolId !== undefined && server.poolNameLabel !== undefined"
                  icon="object:pool"
                  size="small"
                  :to="{ name: '/pool/[id]/dashboard', params: { id: server.poolId } }"
                >
                  {{ server.poolNameLabel }}
                </UiLink>
              </template>
              <template v-if="server.poolId !== undefined" #addons>
                <VtsCopyButton :value="server.poolId" />
              </template>
            </VtsCardRowKeyValue>
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
          </div>
        </UiPanelCard>
        <UiAlert v-else accent="danger">
          {{ t('connection-failed') }}
          <template #description>
            {{ t('unable-to-connect-to-the-pool') }}
          </template>
        </UiAlert>
        <UiPanelCard>
          <UiCardTitle>
            {{ t('connection') }}
          </UiCardTitle>
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
              <HostLink v-if="primaryHost" :host="primaryHost" size="small" />
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
        </UiPanelCard>
        <UiPanelCard v-if="hosts !== undefined">
          <UiCardTitle>
            <span>
              {{ t('hosts') }}
              <UiCounter :value="hosts.length" accent="neutral" size="small" variant="primary" />
            </span>
          </UiCardTitle>
          <VtsStateHero v-if="hosts.length === 0" format="card" type="no-data" size="small">
            {{ t('no-data') }}
          </VtsStateHero>
          <template v-else>
            <li v-for="host in hosts" :key="host.id" v-tooltip class="text-ellipsis">
              <HostLink :host="host" size="small" />
            </li>
          </template>
        </UiPanelCard>
        <UiPanelCard v-if="server.error">
          <UiCardTitle>
            {{ t('error') }}
            <UiCounter :value="1" accent="danger" size="small" variant="primary" />
          </UiCardTitle>
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
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
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

const connectionStatus = useMapper(
  () => (server ? (server.error ? 'error' : server.status) : 'error'),
  {
    error: { accent: 'danger', text: t('unable-to-connect-to-the-pool') },
    disconnected: { accent: 'muted', text: t('disconnected') },
    connected: { accent: 'success', text: t('connected') },
    connecting: { accent: 'info', text: t('connecting') },
  },
  'error'
)
</script>

<style scoped lang="postcss">
.pool-side-panel {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
