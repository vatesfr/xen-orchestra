<template>
  <UiCard>
    <UiCardTitle>
      {{ t('network') }}
    </UiCardTitle>
    <div class="content">
      <template v-if="host.address">
        <VtsCardRowKeyValue>
          <template #key>{{ t('management-ip') }}</template>
          <template #value>{{ host.address }}</template>
          <template #addons>
            <VtsCopyButton :value="host.address" />
          </template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue v-else>
        <template #key>{{ t('management-ip', host.address) }}</template>
      </VtsCardRowKeyValue>
      <template v-if="ipV4Addresses.length > 0">
        <VtsCardRowKeyValue v-for="(ip, index) in ipV4Addresses" :key="ip">
          <template #key>
            <div v-if="index === 0">{{ t('ipv4', ipV4Addresses.length) }}</div>
          </template>
          <template #value>{{ ip }}</template>
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
        <template #key>{{ t('ipv4') }}</template>
      </VtsCardRowKeyValue>
      <template v-if="ipV6Addresses.length > 0">
        <VtsCardRowKeyValue v-for="(ip, index) in ipV6Addresses" :key="ip">
          <template #key>
            <div v-if="index === 0">{{ t('ipv6', ipV6Addresses.length) }}</div>
          </template>
          <template #value>{{ ip }}</template>
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
        <template #key>{{ t('ipv6') }}</template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection'
import type { XoHost } from '@/types/xo/host.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { pifsByHost } = useXoPifCollection()

const pifs = computed(() => pifsByHost.value.get(host.id))
const ipV4Addresses = computed(() => pifs.value?.map(pif => pif.ip).filter(ip => ip) ?? [])
const ipV6Addresses = computed(
  () =>
    pifs.value?.reduce<string[]>((acc, pif) => {
      if (pif.ipv6) {
        acc.push(...pif.ipv6.filter(ip => ip))
      }
      return acc
    }, []) ?? []
)
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
