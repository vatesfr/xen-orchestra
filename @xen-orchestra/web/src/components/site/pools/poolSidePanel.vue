<template>
  <VtsLoadingHero v-if="!isPoolReady && !isHostready" type="panel" />
  <UiPanel v-else>
    <template #header>
      <UiButton
        v-tooltip="$t('coming-soon')"
        disabled
        variant="tertiary"
        size="medium"
        accent="brand"
        :left-icon="faEdit"
      >
        {{ $t('change-status') }}
      </UiButton>
      <UiButton
        v-tooltip="$t('coming-soon')"
        disabled
        variant="tertiary"
        size="medium"
        accent="danger"
        :left-icon="faTrash"
      >
        {{ $t('forget') }}
      </UiButton>
      <UiButtonIcon v-tooltip="$t('coming-soon')" disabled accent="brand" size="medium" :icon="faEllipsis" />
    </template>
    <template #default>
      <UiCard class="card-container">
        <UiCardTitle class="typo-body-bold text-ellipsis">
          {{ $t('general-information') }}
        </UiCardTitle>
        <div class="content">
          <!-- Pool -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('pool') }}</template>
            <template #value>
              <UiLink :icon="faCity" size="small" :to="`/pool/${server.poolId}/`">
                {{ server.poolNameLabel }}
              </UiLink>
            </template>
            <template #addons>
              <VtsCopyButton :value="server.poolNameLabel ?? ''" />
            </template>
          </VtsCardRowKeyValue>
          <!-- ID -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('id') }}</template>
            <template #value>{{ server.id }}</template>
            <template #addons>
              <VtsCopyButton :value="server.host" />
            </template>
          </VtsCardRowKeyValue>
          <!-- Description -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('description') }}</template>
            <template #value>{{ server.poolNameDescription }}</template>
            <template #addons>
              <VtsCopyButton :value="server.username" />
            </template>
          </VtsCardRowKeyValue>
          <!-- tag -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('tags') }}</template>
            <template v-if="(pool?.tags.length ?? 0) > 0" #value>
              <div class="tags">
                <UiTag v-for="tag in pool?.tags" :key="tag" accent="info" variant="primary">{{ tag }}</UiTag>
              </div>
            </template>
            <template #addons>
              <VtsCopyButton :value="pool?.tags.join(', ')!" />
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
      <UiCard class="card-container">
        <UiCardTitle class="typo-body-bold text-ellipsis">
          {{ $t('connection') }}
        </UiCardTitle>
        <VtsCardRowKeyValue>
          <template #key>{{ $t('status') }}</template>
          <template #value>
            <UiInfo :accent="connectionStatus.accent">
              {{ connectionStatus.text }}
            </UiInfo>
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ $t('primary-host') }}</template>
          <template v-if="primaryHost" #value>
            <UiLink :icon="faServer" size="small" :to="`/host/${primaryHost.id}/`">
              {{ primaryHost.name_label }}
            </UiLink>
          </template>
          <template #addons>
            <VtsCopyButton :value="primaryHost?.name_label ?? ''" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ $t('ip-address') }}</template>
          <template #value> {{ server.host }}</template>
          <template #addons>
            <VtsCopyButton :value="server.host" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ $t('proxy-url') }}</template>
          <template #value> {{ server.httpProxy }}</template>
          <template #addons>
            <VtsCopyButton :value="server.httpProxy ?? ''" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ $t('username') }}</template>
          <template #value> {{ server.username }}</template>
          <template #addons>
            <VtsCopyButton :value="server.username" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>{{ $t('read-only') }}</template>
          <template #value>
            <VtsEnabledState :enabled="server.readOnly" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue />
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
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCity, faEdit, faEllipsis, faServer, faTrash } from '@fortawesome/free-solid-svg-icons'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { server } = defineProps<{
  server: XoServer
}>()

const { t } = useI18n()

const { isReady: isPoolReady, get: getpool } = usePoolStore().subscribe()
const { isReady: isHostready, getMasterHostByPoolId } = useHostStore().subscribe()
const pool = computed(() => (server.poolId ? getpool(server.poolId) : undefined))

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

const primaryHost = computed(() => (server.poolId ? getMasterHostByPoolId(server.poolId) : undefined))
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
