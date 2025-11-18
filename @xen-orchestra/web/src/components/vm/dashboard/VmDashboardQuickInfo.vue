<template>
  <VtsQuickInfoCard class="vm-dashboard-quick-info" :loading="!areVmsReady">
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('state')">
        <template #value>
          <span class="value">
            <VtsIcon :name="powerState.icon" size="medium" />
            {{ powerState.text }}
          </span>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('ip-address')" :value="vm.mainIpAddress" />
      <VtsQuickInfoRow :label="t('created-on')" :value="installDateFormatted" />
      <VtsQuickInfoRow :label="t('created-by')" :value="userLabel ?? t('unknown')" />
      <VtsQuickInfoRow :label="t('started')" :value="relativeStartTime" />
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('uuid')" :value="vm.id" />
      <VtsQuickInfoRow :label="t('pool')">
        <template #value>
          <span v-if="pool" class="value">
            <VtsIcon name="fa:city" size="medium" />
            <UiLink :to="`/pool/${pool.id}/dashboard`" size="medium">
              {{ pool.name_label }}
            </UiLink>
          </span>
          <span v-else>
            {{ t('none') }}
          </span>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('host')">
        <template #value>
          <span v-if="host" class="value">
            <VtsObjectIcon type="host" :state="hostPowerState" size="medium" />
            <UiLink :to="`/host/${host.id}/dashboard`" size="medium">
              {{ host.name_label }}
            </UiLink>
            <VtsIcon v-if="isMaster" v-tooltip="t('master')" name="legacy:primary" size="medium" />
          </span>
          <span v-else>
            {{ t('none') }}
          </span>
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('description')" :value="vm.name_description" />
      <VtsQuickInfoRow :label="t('os-name')" :value="vm.os_version?.name" />
      <VtsQuickInfoRow :label="t('virtualization-type')" :value="virtualizationType" />
      <VtsQuickInfoRow :label="t('guest-tools')">
        <template #value>
          <div class="value">
            <VtsIcon
              v-if="guestToolsDisplay.value !== '-'"
              v-tooltip="guestToolsDisplay.tooltip"
              :name="guestToolsDisplay.type === 'link' ? 'legacy:halted' : 'legacy:checked'"
              size="medium"
            />
            <UiLink
              v-if="guestToolsDisplay.type === 'link'"
              size="small"
              href="https://docs.xcp-ng.org/vms/#guest-tools"
            >
              {{ guestToolsDisplay.value }}
            </UiLink>
            <template v-else>
              <span v-tooltip class="text-ellipsis"> {{ guestToolsDisplay.value }}</span>
            </template>
          </div>
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('vcpus')" :value="String(vm.CPUs.number)" />
      <VtsQuickInfoRow :label="t('ram')" :value="ram" />
      <VtsQuickInfoRow :label="t('tags')">
        <template #value>
          <UiTagsList v-if="vm.tags.length > 0">
            <UiTag v-for="tag in vm.tags" :key="tag" accent="info" variant="secondary">
              {{ tag }}
            </UiTag>
          </UiTagsList>
        </template>
      </VtsQuickInfoRow>
    </VtsQuickInfoColumn>
  </VtsQuickInfoCard>
</template>

<script lang="ts" setup>
import { useXoHostUtils } from '@/composables/xo-host.composable.ts'
import { useXoVmUtils } from '@/composables/xo-vm-utils.composable.ts'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import { useXoUserResource } from '@/remote-resources/use-xo-user.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsQuickInfoCard from '@core/components/quick-info-card/VtsQuickInfoCard.vue'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { formatSize } from '@core/utils/size.util.ts'
import { type XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { areVmsReady } = useXoVmCollection()
const { useGetPoolById } = useXoPoolCollection()
const { getVmHost } = useXoVmCollection()
const { isMasterHost } = useXoHostCollection()
const { getHostState } = useXoHostUtils()

const { powerState, installDateFormatted, relativeStartTime, guestToolsDisplay } = useXoVmUtils(() => vm)

const { user } = useXoUserResource({}, () => vm.creation?.user)

const userLabel = computed(() => user.value?.name || user.value?.email)

const pool = useGetPoolById(vm.$pool)

const ram = computed(() => formatSize(vm.memory.size, 1))

const virtualizationType = computed(() =>
  vm.virtualizationMode === 'hvm' && vm.pvDriversDetected ? 'pvhvm' : vm.virtualizationMode
)

const host = computed(() => getVmHost(vm))

const isMaster = computed(() => (host.value !== undefined ? isMasterHost(host.value.id) : false))

const hostPowerState = computed(() => {
  return host?.value ? getHostState(host.value?.power_state) : 'unknown'
})
</script>

<style lang="postcss" scoped>
.vm-dashboard-quick-info {
  .value {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
