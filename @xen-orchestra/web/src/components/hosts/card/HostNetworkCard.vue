<template>
  <VtsStateHero v-if="!arePifsReady" format="card" busy size="medium" />
  <UiCard v-else>
    <UiCardTitle>
      {{ t('network') }}
    </UiCardTitle>
    <div class="content">
      <template v-if="masterIp.length">
        <VtsCardRowKeyValue v-for="(ip, index) in masterIp" :key="ip">
          <template #key>
            <div v-if="index === 0">{{ t('management-ip', masterIp.length) }}</div>
          </template>
          <template #value>
            <span class="text-ellipsis">{{ ip }}</span>
          </template>
          <template #addons>
            <VtsCopyButton :value="ip" />
            <UiButtonIcon
              v-if="index === 0 && masterIp.length > 1"
              v-tooltip="t('coming-soon')"
              disabled
              icon="fa:ellipsis"
              size="medium"
              accent="brand"
            />
          </template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue v-else>
        <template #key>{{ t('management-ip', masterIp.length) }}</template>
      </VtsCardRowKeyValue>
      <template v-if="ipV4Addresses.length">
        <VtsCardRowKeyValue v-for="(ip, index) in ipV4Addresses" :key="ip">
          <template #key>
            <div v-if="index === 0">{{ t('ipv4-address', ipV4Addresses.length) }}</div>
          </template>
          <template #value>
            <span class="text-ellipsis">{{ ip }}</span>
          </template>
          <template #addons>
            <VtsCopyButton :value="ip" />
            <UiButtonIcon
              v-if="index === 0 && ipV4Addresses.length > 1"
              v-tooltip="t('coming-soon')"
              disabled
              icon="fa:ellipsis"
              size="medium"
              accent="brand"
            />
          </template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue v-else>
        <template #key>{{ t('ipv4-address', ipV4Addresses.length) }}</template>
      </VtsCardRowKeyValue>
      <template v-if="ipV6Addresses.length">
        <VtsCardRowKeyValue v-for="(ip, index) in ipV6Addresses" :key="ip">
          <template #key>
            <div v-if="index === 0">{{ t('ipv6-address', ipV6Addresses.length) }}</div>
          </template>
          <template #value>
            <span class="text-ellipsis">{{ ip }}</span>
          </template>
          <template #addons>
            <VtsCopyButton :value="ip" />
            <UiButtonIcon
              v-if="index === 0 && ipV6Addresses.length > 1"
              v-tooltip="t('coming-soon')"
              disabled
              icon="fa:ellipsis"
              size="medium"
              accent="brand"
            />
          </template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue v-else>
        <template #key>{{ t('ipv6-address') }}</template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection'
import type { XoHost } from '@/types/xo/host.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { pifsByHost, arePifsReady, hostMasterPifsByNetwork } = useXoPifCollection()

const pifs = computed(() => pifsByHost.value.get(host.id))
const ipV4Addresses = computed(() => pifs.value?.map(pif => pif.ip).filter(ip => ip !== '') ?? [])
const ipV6Addresses = computed(() => pifs.value?.flatMap(pif => pif.ipv6).filter(ipv6 => ipv6 !== '') ?? [])
const masterPifs = computed(() => pifs.value?.flatMap(pif => hostMasterPifsByNetwork.value.get(pif.$network)))
const masterIp = computed(() =>
  (masterPifs.value ?? [])
    .map(pif => (typeof pif?.ip === 'string' ? pif.ip : undefined))
    .filter((ip): ip is string => typeof ip === 'string' && ip !== '')
)
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
