<template>
  <VtsQuickInfoCard class="host-dashboard-quick-info" :loading="!isReady">
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('state')">
        <template #value>
          <VtsIcon :name="powerState.icon" size="medium" />
          {{ powerState.text }}
        </template>
      </VtsKeyValueRow>
      <VtsKeyValueRow :label="t('ip-address')" :value="host.address" copy />
      <VtsKeyValueRow :label="t('started')" :value="isRunning ? relativeStartTime : undefined" />
      <VtsKeyValueRow :label="t('master')">
        <template #value>
          <template v-if="isMaster">
            <VtsIcon v-tooltip="t('master')" name="status:primary-circle" size="medium" />
            {{ t('this-host') }}
          </template>
          <UiLink
            v-else-if="masterHost !== undefined"
            :to="`/host/${masterHost.uuid}/`"
            size="medium"
            icon="object:host"
          >
            {{ masterHost.name_label }}
          </UiLink>
        </template>
      </VtsKeyValueRow>
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('uuid')" :value="host.uuid" copy />
      <VtsKeyValueRow :label="t('description')" :value="host.name_description" />
      <VtsKeyValueRow :label="t('version')" :value="host.software_version.product_version" />
      <VtsKeyValueRow :label="t('hardware')" :value="manufacturerInfo" />
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('cores-with-sockets')" :value="coreSocketInfo" />
      <VtsKeyValueRow :label="t('ram')" :value="`${ram?.value} ${ram?.prefix}`" />
      <VtsKeyValueRow :label="t('tags')">
        <template #value>
          <UiTagsList v-if="host.tags.length">
            <VtsTag v-for="tag in host.tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
      </VtsKeyValueRow>
    </VtsKeyValueList>
  </VtsQuickInfoCard>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostUtils } from '@/modules/host/composables/host-utils.composable.ts'
import { getHostCoreSocketInfo, getHostManufacturerInfo } from '@/modules/host/utils/host.util.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsKeyValueList from '@core/components/key-value-list/VtsKeyValueList.vue'
import VtsKeyValueRow from '@core/components/key-value-row/VtsKeyValueRow.vue'
import VtsQuickInfoCard from '@core/components/quick-info-card/VtsQuickInfoCard.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { masterHost, isReady: isPoolReady } = usePoolStore().subscribe()
const { isReady: isHostReady } = useHostStore().subscribe()
const { getHostMemory, isReady: isHostMetricsReady } = useHostMetricsStore().subscribe()

const { isMaster, isRunning, powerState, relativeStartTime } = useHostUtils(() => host)

const isReady = logicAnd(isPoolReady, isHostReady, isHostMetricsReady)

const manufacturerInfo = computed(() => getHostManufacturerInfo(host))

const coreSocketInfo = computed(() => getHostCoreSocketInfo(host))

const ram = computed(() => {
  const memory = getHostMemory(host)

  return formatSizeRaw(memory?.size, 0)
})
</script>
