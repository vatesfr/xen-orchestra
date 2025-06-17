<template>
  <VtsLoadingHero v-if="!isPoolReady && !isHostready" type="panel" />
  <UiPanel v-else>
    <template #header>
      <UiButton
        v-tooltip="t('coming-soon')"
        disabled
        variant="tertiary"
        size="medium"
        accent="brand"
        :left-icon="faEdit"
      >
        {{ t('change-state') }}
      </UiButton>
      <UiButton
        v-tooltip="t('coming-soon')"
        disabled
        variant="tertiary"
        size="medium"
        accent="danger"
        :left-icon="faTrash"
      >
        {{ t('forget') }}
      </UiButton>
      <UiButtonIcon v-tooltip="t('coming-soon')" disabled accent="brand" size="medium" :icon="faEllipsis" />
    </template>
    <template #default>
      <UiCard v-if="server.error === undefined" class="card-container">
        <UiCardTitle>
          {{ t('general-information') }}
        </UiCardTitle>
        <div class="content">
          <!-- Pool -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('pool') }}</template>
            <template #value>
              <UiLink
                v-if="server.poolId !== undefined && server.poolNameLabel !== undefined"
                :icon="faCity"
                size="small"
                :to="`/pool/${server.poolId}/`"
              >
                {{ server.poolNameLabel }}
              </UiLink>
            </template>
            <template v-if="server.poolId !== undefined" #addons>
              <VtsCopyButton :value="server.poolId" />
            </template>
          </VtsCardRowKeyValue>
          <!-- ID -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('id') }}</template>
            <template #value>{{ server.id }}</template>
            <template #addons>
              <VtsCopyButton :value="server.id" />
            </template>
          </VtsCardRowKeyValue>
          <!-- Description -->
          <VtsCardRowKeyValue>
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
                <UiTag v-for="tag in pool.tags" :key="tag" accent="info" variant="primary">{{ tag }}</UiTag>
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
        <UiCardTitle class="typo-body-bold text-ellipsis">
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
            <UiLink v-if="primaryHost" :icon="faServer" size="small" :to="`/host/${primaryHost.id}/`">
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
            <VtsEnabledState :enabled="server.readOnly" />
          </template>
        </VtsCardRowKeyValue>
        <!-- self-signed-certificates -->
        <VtsCardRowKeyValue>
          <template #key>{{ t('self-signed-certificates') }}</template>
          <template #value>
            <!-- todo add information button. waiting modal -->
            <VtsEnabledState :enabled="server.allowUnauthorized" />
          </template>
        </VtsCardRowKeyValue>
      </UiCard>
      <UiCard v-if="hosts">
        <UiCardTitle>
          <span>
            {{ t('hosts') }}
            <UiCounter :value="hosts?.length ?? 0" accent="neutral" size="small" variant="primary" />
          </span>
        </UiCardTitle>
        <VtsNoDataHero v-if="hosts?.length === 0" type="panel" />
        <template v-else>
          <UiLink v-for="host in hosts" :key="host.id" :to="`/host/${host.id}/`" :icon="faServer" size="small">
            {{ host.name_label }}
            <VtsIcon v-if="primaryHost?.id === host.id" accent="info" :icon="faCircle" :overlay-icon="faStar" />
          </UiLink>
        </template>
      </UiCard>
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import type { XoServer } from '@/types/xo/server.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCircle, faCity, faEdit, faEllipsis, faServer, faStar, faTrash } from '@fortawesome/free-solid-svg-icons'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { server } = defineProps<{
  server: XoServer
}>()

const { t } = useI18n()

const { isReady: isPoolReady, get: getpool } = usePoolStore().subscribe()
const { isReady: isHostready, get: getHostById, hostsByPool } = useHostStore().subscribe()

const pool = computed(() => (server.poolId ? getpool(server.poolId) : undefined))
const primaryHost = computed(() => (server.master ? getHostById(server.master) : undefined))
const hosts = computed(() => (server.poolId ? hostsByPool.value.get(server.poolId) : undefined))

const connectionStatus: ComputedRef<{ accent: InfoAccent; text: string }> = computed(() => {
  if (server.error) {
    return { accent: 'danger', text: t('error') }
  }

  switch (server.status) {
    case 'disconnected':
      return { accent: 'muted', text: t('disconnected') }
    case 'connected':
      return { accent: 'success', text: t('connected') }
    case 'connecting':
      return { accent: 'info', text: t('connecting') }
    default:
      return { accent: 'muted', text: t('unknown') }
  }
})
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

    .tags {
      display: flex;
    }
  }
}
</style>
