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
          <template v-if="host">
            <UiLink
              :to="{ name: '/host/[id]/dashboard', params: { id: host.id } }"
              size="medium"
              :icon="`object:host:${hostPowerState}`"
            >
              {{ host.name_label }}
            </UiLink>
            <VtsIcon v-if="isMaster" v-tooltip="t('master')" name="status:primary-circle" size="medium" />
          </template>
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
          <div class="value">
            <VtsIcon
              v-if="guestToolsDisplay.value !== '-'"
              v-tooltip="guestToolsDisplay.tooltip"
              :name="guestToolsDisplay.type === 'link' ? 'status:halted-circle' : 'status:success-circle'"
              size="medium"
            />
            <UiLink v-if="guestToolsDisplay.type === 'link'" size="small" :href="XCP_LINKS.GUEST_TOOLS">
              {{ guestToolsDisplay.value }}
            </UiLink>
            <template v-else>
              <span v-tooltip class="text-ellipsis"> {{ guestToolsDisplay.value }}</span>
            </template>
          </div>
        </template>
      </VtsKeyValueRow>
    </VtsKeyValueList>
    <VtsKeyValueList>
      <VtsKeyValueRow :label="t('vcpus')" :value="String(vm.CPUs.number)" />
      <VtsKeyValueRow :label="t('ram')" :value="ram" />
      <VtsKeyValueRow :label="t('tags')">
        <template #value>
          <UiTagsList v-if="vm.tags.length > 0">
            <UiTag v-for="tag in vm.tags" :key="tag" accent="info" variant="secondary">
              {{ tag }}
            </UiTag>
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
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmCollection, type FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { XCP_LINKS } from '@/shared/constants.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsKeyValueList from '@core/components/key-value-list/VtsKeyValueList.vue'
import VtsKeyValueRow from '@core/components/key-value-row/VtsKeyValueRow.vue'
import VtsQuickInfoCard from '@core/components/quick-info-card/VtsQuickInfoCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
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
