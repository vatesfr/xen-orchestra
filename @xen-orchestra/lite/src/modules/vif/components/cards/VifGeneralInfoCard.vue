<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="vifDevice" />
      <VtsTabularKeyValueRow :label="t('uuid')">
        <template #value>
          <VtsCodeSnippet :content="vif.uuid" />
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
        <template v-if="vif.locking_mode === VIF_LOCKING_MODE.DISABLED" #value>
          <VtsStatus status="disabled" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('check-summing')">
        <template #value>
          <VtsStatus :status="isTxChecksummingEnabled(vif)" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/network.util.ts'
import { isTxChecksummingEnabled } from '@/modules/vif/utils/vif-tx-checksumming.util.ts'
import { getVifRateLimit } from '@/modules/vif/utils/vif.util.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { useVifLockingModeLabel } from '@core/utils/vif.util.ts'
import { VIF_LOCKING_MODE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{ vif: XenApiVif }>()

const { t } = useI18n()

const { getByOpaqueRef: getNetworkByOpaqueRef } = useNetworkStore().subscribe()
const { getPifsByNetworkRef } = usePifStore().subscribe()
const { pool } = usePoolStore().subscribe()

const lockingModeLabel = useVifLockingModeLabel(() => vif.locking_mode)

const network = computed(() => getNetworkByOpaqueRef(vif.network))

const networkTo = computed(() =>
  pool.value && network.value ? getPoolNetworkRoute(pool.value.uuid, network.value.uuid) : undefined
)

const networkVlan = computed(() => {
  const [pif] = getPifsByNetworkRef(vif.network)

  if (pif === undefined) {
    return
  }

  return pif.VLAN !== -1 ? String(pif.VLAN) : t('none')
})

const vifStatus = computed(() =>
  vif.currently_attached ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED
)

const vifDevice = computed(() => `${t('vif')}${vif.device}`)

const rateLimit = computed(() => {
  const kbps = getVifRateLimit(vif)

  return kbps !== undefined ? `${kbps} ${t('bytes:kbs')}` : undefined
})
</script>
