<template>
  <UiCard class="appliance-connection-card">
    <UiCardTitle>
      {{ t('appliance:connection-to-vates') }}
      <template #info>
        <ApplianceNewProxyButton v-if="proxy === undefined" />
        <ApplianceEditProxyButton v-else :proxy />
      </template>
    </UiCardTitle>

    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('proxy')" :value="proxyAddress" />
      <VtsTabularKeyValueRow :label="t('appliance:vates-servers')">
        <template v-if="serversState !== undefined" #value>
          <UiInfo :accent="serversState.accent">{{ serversState.label }}</UiInfo>
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>

    <p v-if="reachable === false && proxy === undefined" class="hint typo-body-regular-small">
      <template v-if="lastReachedAt !== undefined">
        {{ t('appliance:last-reached', { date: formatDateTime(lastReachedAt) }) }}
      </template>
      {{ t('appliance:set-proxy-hint') }}
    </p>
  </UiCard>
</template>

<script lang="ts" setup>
import ApplianceEditProxyButton from '@/modules/appliance/components/actions/edit-proxy/ApplianceEditProxyButton.vue'
import ApplianceNewProxyButton from '@/modules/appliance/components/actions/new-proxy/ApplianceNewProxyButton.vue'
import type { XoaProxy } from '@/modules/appliance/types/xoa-proxy.type.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { proxy, reachable = undefined } = defineProps<{
  proxy?: XoaProxy
  reachable?: boolean
  lastReachedAt?: number
}>()

const { t } = useI18n()

const proxyAddress = computed(() => {
  if (proxy === undefined) {
    return t('appliance:no-proxy')
  }

  return `${proxy.host}:${proxy.port}`
})

const serversState = computed<{ label: string; accent: InfoAccent } | undefined>(() => {
  if (reachable === undefined) {
    return undefined
  }

  if (!reachable) {
    return { label: t('appliance:unreachable'), accent: 'danger' }
  }

  if (proxy === undefined) {
    return { label: t('appliance:reachable'), accent: 'success' }
  }

  return { label: t('appliance:reachable-through-proxy'), accent: 'success' }
})
</script>

<style lang="postcss" scoped>
.appliance-connection-card {
  .hint {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
