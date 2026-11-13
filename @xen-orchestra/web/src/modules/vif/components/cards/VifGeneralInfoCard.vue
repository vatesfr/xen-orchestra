<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="vifDevice" />
      <VtsTabularKeyValueRow :label="t('uuid')">
        <template #value>
          <VtsCodeSnippet :content="vif.id" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('network')">
        <template v-if="network" #value>
          <UiLink size="medium" :to="networkTo" icon="object:network">
            {{ network.name_label }}
          </UiLink>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('device')" :value="vifDevice" />
      <VtsTabularKeyValueRow :label="t('vif-status')">
        <template #value>
          <VtsStatus :status="vifStatus" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('vlan')" :value="networkVlan" />
      <VtsTabularKeyValueRow :label="t('mtu')" :value="String(vif.MTU)" />
      <VtsTabularKeyValueRow :label="t('rate-limit')" :value="rateLimit" />
      <VtsTabularKeyValueRow :label="t('locking-mode')" :value="lockingModeLabel">
        <template v-if="vif.lockingMode === VIF_LOCKING_MODE.DISABLED" #value>
          <VtsStatus status="disabled" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('check-summing')">
        <template #value>
          <VtsStatus :status="vif.txChecksumming" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoNetworkUtils } from '@/modules/network/composables/xo-network-utils.composable.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import { useXoVifUtils } from '@/modules/vif/composables/xo-vif-utils.composable.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { VIF_LOCKING_MODE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{ vif: FrontXoVif }>()

const { t } = useI18n()

const { useGetNetworkById } = useXoNetworkCollection()
const { lockingModeLabel } = useXoVifUtils(() => vif)

const network = useGetNetworkById(() => vif.$network)

const networkTo = computed(() =>
  network.value ? getPoolNetworkRoute(network.value.$pool, network.value.id) : undefined
)

const { networkVlan } = useXoNetworkUtils(network)

const vifStatus = computed(() => (vif.attached ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED))

const vifDevice = computed(() => `${t('vif')}${vif.device}`)

const rateLimit = computed(() => (vif.rateLimit !== undefined ? `${vif.rateLimit} kB/s` : undefined))
</script>
