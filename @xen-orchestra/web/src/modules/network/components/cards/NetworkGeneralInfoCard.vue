<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="network.name_label" />
      <VtsTabularKeyValueRow :label="t('uuid')">
        <template #value>
          <VtsCodeSnippet :content="network.id" copy />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('description')" :value="network.name_description" />
      <VtsTabularKeyValueRow :label="t('type')" :value="networkTypeLabel" />
      <VtsTabularKeyValueRow :label="t('vlan')" :value="networkVlan" />
      <VtsTabularKeyValueRow :label="t('mtu')" :value="String(network.MTU)" />
      <VtsTabularKeyValueRow :label="t('network-block-device')" :value="networkNbd" />
      <VtsTabularKeyValueRow :label="t('locking-mode-default')" :value="networkDefaultLockingMode" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoNetworkUtils } from '@/modules/network/composables/xo-network-utils.composable.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{ network: FrontXoNetwork }>()

const { t } = useI18n()

const { networkVlan, networkNbd, networkDefaultLockingMode, networkTypeLabel } = useXoNetworkUtils(() => network)
</script>
