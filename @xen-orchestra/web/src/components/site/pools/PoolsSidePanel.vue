<template>
  <VtsStateHero v-if="!arePoolsReady" format="panel" type="busy" size="medium" />
  <UiPanel v-else :class="{ 'mobile-drawer': uiStore.isMobile }">
    <template #header>
      <div :class="{ 'action-buttons-container': uiStore.isMobile }">
        <UiButtonIcon
          v-tooltip="t('action:close')"
          size="small"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isMobile ? 'fa:angle-left' : 'fa:close'"
          @click="emit('close')"
        />
      </div>
    </template>
    <template #default>
      <UiCard v-if="server.error === undefined" class="card-container">
        <UiCardTitle>
          {{ t('general-information') }}
        </UiCardTitle>
        <div class="content">
          <!-- ID -->
          <VtsCodeSnippet :content="server.id" copy />
          <!-- Pool -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('pool') }}</template>
            <template #value>
              <UiLink
                v-if="server.poolId !== undefined && server.poolNameLabel !== undefined"
                icon="fa:city"
                size="small"
                :to="`/pool/${server.poolId}/dashboard`"
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
                <UiTag v-for="tag in pool.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
              </UiTagsList>
            </template>
            <template v-if="pool !== undefined && pool.tags.length > 0" #addons>
              <VtsCopyButton :value="pool.tags.join(', ')" />
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
      <UiAlert v-else accent="danger">
        {{ t('connection-failed') }}
        <template #description>
          {{ t('unable-to-connect-to-the-pool') }}
        </template>
      </UiAlert>
      <UiCard class="card-container">
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
            <UiLink
              v-if="primaryHost !== undefined"
              icon="fa:server"
              size="small"
              :to="`/host/${primaryHost.id}/dashboard`"
            >
              {{ primaryHost.name_label }}
            </UiLink>
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
      </UiCard>
      <UiCard v-if="hosts !== undefined">
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
          <UiLink v-for="host in hosts" :key="host.id" :to="`/host/${host.id}/dashboard`" icon="fa:server" size="small">
            {{ host.name_label }}
            <VtsIcon v-if="primaryHost?.id === host.id" accent="info" name="legacy:primary" size="medium" />
          </UiLink>
        </template>
      </UiCard>
      <UiCard v-if="server.error">
        <UiCardTitle>
          {{ t('error') }}
          <UiCounter :value="1" accent="danger" size="small" variant="primary" />
        </UiCardTitle>
        <UiLogEntryViewer accent="danger" :label="t('api-error-details')" size="small" :content="server.error" />
      </UiCard>
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useMapper } from '@core/packages/mapper'
import { useUiStore } from '@core/stores/ui.store'
import type { XoServer } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { server } = defineProps<{
  server: XoServer
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const uiStore = useUiStore()
const { arePoolsReady, useGetPoolById } = useXoPoolCollection()
const { useGetHostById, hostsByPool } = useXoHostCollection()

const pool = useGetPoolById(() => server.poolId)
const primaryHost = useGetHostById(() => server.master)
const hosts = computed(() => (server.poolId ? hostsByPool.value.get(server.poolId) : undefined))

const connectionStatus = useMapper(
  () => (server.error ? 'error' : server.status),
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
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}

.mobile-drawer {
  position: fixed;
  inset: 0;

  .action-buttons-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
</style>
