<template>
  <UiCard>
    <UiTitle>
      {{ t('pool-management') }}
    </UiTitle>
    <VtsStateHero v-if="!areHostsReady" format="card" type="busy" size="medium" />
    <VtsTabularKeyValueList v-else>
      <VtsTabularKeyValueRow :label="t('master')">
        <template #value>
          <UiLink
            v-if="primaryHost"
            icon="object:host"
            :to="{ name: '/host/[id]/dashboard', params: { id: pool.master } }"
            size="medium"
          >
            {{ primaryHost.name_label }}
          </UiLink>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('auto-power')">
        <template #value>
          <VtsStatus :status="pool.auto_poweron" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('high-availability')">
        <template #value>
          <VtsStatus :status="pool.HA_enabled" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('reboot-vm-internal-shutdown')">
        <template #value>
          <VtsStatus :status="pool.haRebootVmOnInternalShutdown" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('migration-compression')">
        <template #value>
          <VtsStatus :status="pool.migrationCompression ?? false" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('live-vcpu-scaling')">
        <template #value>
          <div class="live-vcpu-scaling">
            <VtsStatus :status="effectiveVcpusMax !== undefined" />
            <span v-if="effectiveVcpusMax !== undefined">
              {{ t('live-vcpu-scaling:up-to', { n: effectiveVcpusMax }) }}
            </span>
            <UiButtonIcon
              v-tooltip="editLiveVcpuScalingErrorMessage ?? t('action:edit')"
              icon="action:edit"
              size="small"
              accent="brand"
              :disabled="!canEditLiveVcpuScaling"
              @click="editLiveVcpuScaling()"
            />
          </div>
          <UiInfo v-if="isCapped" accent="info" class="capped" wrap>
            {{ t('live-vcpu-scaling:capped-by-host', { set: pool.vcpusMaxHeadroom }) }}
          </UiInfo>
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { usePoolLiveVcpuScalingEdit } from '@/modules/pool/composables/use-pool-live-vcpu-scaling-edit.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { getEffectiveVcpusMax, getLiveVcpuScalingCap } from '@/modules/pool/utils/xo-pool-live-vcpu-scaling.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { useGetHostById, areHostsReady, hostsByPool } = useXoHostCollection()

const primaryHost = useGetHostById(() => pool.master)

const poolHosts = computed(() => hostsByPool.value.get(pool.id) ?? [])

const liveVcpuScalingCap = computed(() => getLiveVcpuScalingCap(poolHosts.value))

// what new VMs actually get: the setting, capped by the smallest host
const effectiveVcpusMax = computed(() => getEffectiveVcpusMax(pool.vcpusMaxHeadroom, poolHosts.value))

const isCapped = computed(
  () =>
    pool.vcpusMaxHeadroom !== undefined &&
    effectiveVcpusMax.value !== undefined &&
    effectiveVcpusMax.value < pool.vcpusMaxHeadroom
)

const { editLiveVcpuScaling, canEditLiveVcpuScaling, editLiveVcpuScalingErrorMessage } = usePoolLiveVcpuScalingEdit(
  () => pool,
  liveVcpuScalingCap
)
</script>

<style lang="postcss" scoped>
.live-vcpu-scaling {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.capped {
  margin-block-start: 0.4rem;
}
</style>
