<template>
  <UiPanelCard>
    <UiPanelCardTitle :label="t('network')" size="medium" />
    <VtsCardRowList>
      <VtsCardRowKeyValue>
        <template #key>{{ t('management-ip') }}</template>
        <template #value>{{ host.address }}</template>
        <template v-if="host.address" #addons>
          <VtsCopyButton :value="host.address" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue :values="ipV4Addresses">
        <template #key>{{ t('ipv4-addresses') }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue :values="ipV6Addresses">
        <template #key>{{ t('ipv6-addresses') }}</template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { pifsByHost } = usePifStore().subscribe()

const pifs = computed(() => pifsByHost.value.get(host.$ref))
const ipV4Addresses = computed(() => pifs.value?.map(pif => pif.IP).filter(ip => ip) ?? [])
const ipV6Addresses = computed(() => pifs.value?.flatMap(pif => pif.IPv6.filter(ip => ip)) ?? [])
</script>
