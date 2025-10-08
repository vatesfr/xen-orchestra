<template>
  <VtsStateHero v-if="!arePoolsReady" format="panel" busy size="medium" />
  <UiPanel v-else :class="{ 'mobile-drawer': uiStore.isMobile }">
    <template #header>
      <div :class="{ 'action-buttons-container': uiStore.isMobile }">
        <UiButtonIcon
          v-if="uiStore.isMobile"
          v-tooltip="t('close')"
          size="medium"
          variant="tertiary"
          accent="brand"
          icon="fa:angle-left"
          @click="emit('close')"
        />
        <div class="action-buttons">
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            variant="tertiary"
            size="medium"
            accent="brand"
            left-icon="fa:edit"
          >
            {{ t('change-state') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            variant="tertiary"
            size="medium"
            accent="danger"
            left-icon="fa:trash"
          >
            {{ t('forget') }}
          </UiButton>
          <UiButtonIcon v-tooltip="t('coming-soon')" disabled accent="brand" size="medium" icon="fa:ellipsis" />
        </div>
      </div>
    </template>
    <template #default>
      <UiCard v-if="server.error === undefined" class="card-container">
        <UiCardTitle>
          {{ t('general-information') }}
        </UiCardTitle>
        <div class="content">
          <!-- Pool -->
          <UiLabelValue :label="t('pool')" :copy-value="server.poolId" ellipsis>
            <template #value>
              <UiLink
                v-if="server.poolId !== undefined && server.poolNameLabel !== undefined"
                icon="fa:city"
                size="small"
                :to="`/pool/${server.poolId}/`"
                class="link"
              >
                <div v-tooltip class="text-ellipsis">
                  {{ server.poolNameLabel }}
                </div>
              </UiLink>
            </template>
          </UiLabelValue>
          <!-- ID -->
          <UiLabelValue :label="t('id')" :value="server.id" :copy-value="server.id" ellipsis />
          <!-- Description -->
          <UiLabelValue
            :label="t('description')"
            :value="server.poolNameDescription"
            :copy-value="server.poolNameDescription"
            ellipsis
          />
          <!-- tag -->
          <UiLabelValue :label="t('tags')" :value="pool?.tags" :copy-value="pool?.tags" ellipsis />
        </div>
      </UiCard>
      <UiAlert v-else accent="danger">
        {{ t('connection-failed') }}
        <template #description>
          {{ t('unable-to-connect-to-the-pool') }}
        </template>
      </UiAlert>
      <UiCard class="card-container">
        <UiCardTitle class="text-ellipsis">
          {{ t('connection') }}
        </UiCardTitle>
        <!-- status -->
        <UiLabelValue :label="t('status')" ellipsis>
          <template #value>
            <UiInfo :accent="connectionStatus.accent">
              {{ connectionStatus.text }}
            </UiInfo>
          </template>
        </UiLabelValue>
        <!-- primary-host -->
        <UiLabelValue :label="t('master')" :copy-value="primaryHost?.id" ellipsis>
          <template #value>
            <UiLink
              v-if="primaryHost !== undefined"
              icon="fa:server"
              size="small"
              :to="`/host/${primaryHost.id}/`"
              class="link"
            >
              <div v-tooltip class="text-ellipsis">
                {{ primaryHost.name_label }}
              </div>
            </UiLink>
          </template>
        </UiLabelValue>
        <!-- ip-address -->
        <UiLabelValue :label="t('ip-address')" :value="server.host" :copy-value="server.host" ellipsis />
        <!-- proxy-url -->
        <UiLabelValue :label="t('proxy-url')" :value="server.httpProxy" :copy-value="server.httpProxy" ellipsis />
        <!-- username -->
        <UiLabelValue :label="t('username')" :value="server.username" :copy-value="server.username" ellipsis />
        <!-- read-only -->
        <UiLabelValue :label="t('read-only')" ellipsis>
          <template #value>
            <VtsStatus :status="server.readOnly" />
          </template>
        </UiLabelValue>
        <!-- self-signed-certificates -->
        <UiLabelValue :label="t('self-signed-certificates')" ellipsis>
          <template #value>
            <!-- todo add information button. waiting modal -->
            <VtsStatus :status="server.allowUnauthorized" />
          </template>
        </UiLabelValue>
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
          <UiLink v-for="host in hosts" :key="host.id" :to="`/host/${host.id}/`" icon="fa:server" size="small">
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
import type { XoServer } from '@/types/xo/server.type'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useMapper } from '@core/packages/mapper'
import { useUiStore } from '@core/stores/ui.store'
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

    .link {
      width: 100%;
    }
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

.action-buttons {
  display: flex;
  align-items: center;
}
</style>
