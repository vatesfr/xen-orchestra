<template>
  <VtsQuickInfoCard :loading="!isReady" class="vm-dashboard-quick-info">
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('state')">
        <template #value>
          <span class="power-state">
            <VtsIcon :name="powerState.icon" size="medium" />
            {{ powerState.text }}
          </span>
        </template>
      </VtsKeyValueRow>
      <VtsKeyValueRow :label="t('ip-address')" :value="mainIpAddress" copy />
      <VtsKeyValueRow :label="t('created-on')" :value="installDateFormatted" />
      <VtsKeyValueRow :label="t('started')" :value="relativeStartTime" />
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('uuid')" :value="vm.uuid" copy />
      <VtsKeyValueRow :label="t('host')">
        <template #value>
          <HostLink v-if="host" :host :to="`/host/${host.uuid}`" size="medium" />
          <span v-else>
            {{ t('none') }}
          </span>
        </template>
      </VtsKeyValueRow>
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('description')" :value="vm.name_description" />
      <VtsKeyValueRow :label="t('os-name')" :value="osName" />
      <VtsKeyValueRow :label="t('virtualization-type')" :value="virtualizationType" />
      <VtsKeyValueRow :label="t('guest-tools')" :value="guestTools" />
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('vcpus')" :value="String(vm.VCPUs_at_startup)" />
      <VtsKeyValueRow :label="t('ram')" :value="`${ram.value} ${ram.prefix}`" />
      <VtsKeyValueRow :label="t('tags')">
        <template #value>
          <UiTagsList v-if="vm.tags.length > 0">
            <VtsTag v-for="tag in vm.tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
      </VtsKeyValueRow>
    </VtsKeyValueList>
  </VtsQuickInfoCard>
</template>

<script lang="ts" setup>
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import HostLink from '@/modules/host/components/HostLink.vue'
import { useVmMetricsInfo } from '@/modules/vm/composables/vm-metrics-info.composable.ts'
import { useVmUtils } from '@/modules/vm/composables/vm-utils.composable.ts'
import { getVmDomainType, getVmIpAddresses } from '@/modules/vm/utils/vm.util.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsKeyValueList from '@core/components/key-value-list/VtsKeyValueList.vue'
import VtsKeyValueRow from '@core/components/key-value-row/VtsKeyValueRow.vue'
import VtsQuickInfoCard from '@core/components/quick-info-card/VtsQuickInfoCard.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XenApiVm
}>()

const { t } = useI18n()

const { isReady, getVmHost } = useVmStore().subscribe()
const { getByOpaqueRef: getGuestMetricsByOpaqueRef } = useVmGuestMetricsStore().subscribe()

const guestMetrics = computed(() => getGuestMetricsByOpaqueRef(vm.guest_metrics))

const host = computed(() => getVmHost(vm))

const { powerState } = useVmUtils(() => vm)

const { osName, guestTools, relativeStartTime, installDateFormatted } = useVmMetricsInfo(() => vm)

const ram = computed(() => formatSizeRaw(vm.memory_dynamic_max, 0))

const domainType = computed(() => getVmDomainType(vm))

const virtualizationType = computed(() =>
  domainType.value === 'hvm' && guestMetrics.value?.PV_drivers_detected ? 'pvhvm' : domainType.value
)

const mainIpAddress = computed(() => getVmIpAddresses(guestMetrics.value)[0])
</script>

<style lang="postcss" scoped>
.vm-dashboard-quick-info {
  .power-state {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
