<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('networks')">
      <template v-if="ipAddresses.length > 0" #action>
        <UiLink size="small" :to="{ name: '/vm/[uuid]/network', params: { uuid: vm.uuid } }">
          {{ t('see-details') }}
        </UiLink>
      </template>
    </UiPanelCardTitle>
    <VtsCardRowList>
      <VtsCardRowKeyValue :values="ipAddresses">
        <template #key>{{ t('ip-addresses') }}</template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { getVmIpAddresses } from '@/modules/vm/utils/vm.util.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XenApiVm
}>()

const { t } = useI18n()

const { getByOpaqueRef: getGuestMetrics } = useVmGuestMetricsStore().subscribe()

const ipAddresses = computed(() => getVmIpAddresses(getGuestMetrics(vm.guest_metrics)))
</script>
