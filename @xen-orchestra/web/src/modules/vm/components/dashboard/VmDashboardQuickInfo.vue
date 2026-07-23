<template>
  <VtsQuickInfoCard class="vm-dashboard-quick-info" :loading="!areVmsReady">
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('state')">
        <template #value>
          <span class="value">
            <VtsIcon :name="powerState.icon" size="medium" />
            {{ powerState.text }}
          </span>
        </template>
      </VtsKeyValueRow>
      <VtsKeyValueRow :label="t('ip-address')" :value="vm.mainIpAddress" />
      <VtsKeyValueRow :label="t('created-on')" :value="installDateFormatted" />
      <VtsKeyValueRow :label="t('created-by')" :value="userLabel ?? t('unknown')" />
      <VtsKeyValueRow :label="t('started')" :value="relativeStartTime" />
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('uuid')" :value="vm.id" />
      <VtsKeyValueRow :label="t('pool')">
        <template #value>
          <UiLink
            v-if="pool"
            :to="{ name: '/pool/[id]/dashboard', params: { id: pool.id } }"
            size="medium"
            icon="object:pool"
          >
            {{ pool.name_label }}
          </UiLink>
          <span v-else>
            {{ t('none') }}
          </span>
        </template>
      </VtsKeyValueRow>
      <VtsKeyValueRow :label="t('host')">
        <template #value>
          <UiLink
            v-if="host"
            :to="{ name: '/host/[id]/dashboard', params: { id: host.id } }"
            size="medium"
            :icon="`object:host:${hostPowerState}`"
            :is-primary="isMaster"
            :primary-tooltip="t('master')"
          >
            {{ host.name_label }}
          </UiLink>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsKeyValueRow>
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('description')" :value="vm.name_description" />
      <VtsKeyValueRow :label="t('os-name')" :value="vm.os_version?.name" />
      <VtsKeyValueRow :label="t('virtualization-type')" :value="virtualizationType" />
      <VtsKeyValueRow :label="t('guest-tools')">
        <template #value>
          <VmGuestToolsValue :guest-tools-display="guestToolsDisplay" :guest-tools-icon="guestToolsIcon" />
        </template>
      </VtsKeyValueRow>
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('vcpus')" :value="String(vm.CPUs.number)" />
      <VtsKeyValueRow :label="t('ram')" :value="ram" />
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
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import VmGuestToolsValue from '@/modules/vm/components/VmGuestToolsValue.vue'
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsKeyValueList from '@core/components/key-value-list/VtsKeyValueList.vue'
import VtsKeyValueRow from '@core/components/key-value-row/VtsKeyValueRow.vue'
import VtsQuickInfoCard from '@core/components/quick-info-card/VtsQuickInfoCard.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { areVmsReady } = useXoVmCollection()
const { useGetPoolById } = useXoPoolCollection()
const { getVmHost } = useXoVmCollection()
const { isMasterHost } = useXoHostCollection()

const { powerState, installDateFormatted, relativeStartTime, guestToolsDisplay, guestToolsIcon } = useXoVmUtils(
  () => vm
)

const { user } = useXoUserResource({}, () => vm.creation?.user)

const userLabel = computed(() => user.value?.name || user.value?.email)

const pool = useGetPoolById(vm.$pool)

const ram = computed(() => formatSize(vm.memory.size, 1))

const virtualizationType = computed(() =>
  vm.virtualizationMode === 'hvm' && vm.pvDriversDetected ? 'pvhvm' : vm.virtualizationMode
)

const host = computed(() => getVmHost(vm))

const isMaster = computed(() => (host.value !== undefined ? isMasterHost(host.value.id) : false))

const hostPowerState = computed(() =>
  host.value ? toLower(host.value.power_state) : toLower(HOST_POWER_STATE.UNKNOWN)
)
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
