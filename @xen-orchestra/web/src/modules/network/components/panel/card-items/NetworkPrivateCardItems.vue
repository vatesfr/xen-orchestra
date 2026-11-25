<template>
  <template v-if="isPrivateNetwork">
    <VtsCardRowKeyValue>
      <template #key>{{ t('preferred-center') }}</template>
      <template #value>
        <HostLink v-if="networkPreferredCenter" :host="networkPreferredCenter" size="small" />
        <template v-else>{{ t('none') }}</template>
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>{{ t('encapsulation') }}</template>
      <template #value>{{ networkEncapsulationLabel }}</template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>{{ t('encryption') }}</template>
      <template #value>
        <VtsStatus :status="isNetworkEncrypted" />
      </template>
    </VtsCardRowKeyValue>
  </template>
</template>

<script setup lang="ts">
import HostLink from '@/modules/host/components/HostLink.vue'
import { useXoNetworkUtils } from '@/modules/network/composables/xo-network-utils.composable.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network: FrontXoNetwork
}>()

const { t } = useI18n()

const { isPrivateNetwork, networkPreferredCenter, networkEncapsulationLabel, isNetworkEncrypted } = useXoNetworkUtils(
  () => network
)
</script>
