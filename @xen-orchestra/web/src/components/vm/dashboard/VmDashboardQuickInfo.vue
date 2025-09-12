<template>
  <VtsQuickInfoCard class="vm-dashboard-quick-info" :loading="!areVmsReady">
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('state')">
        <template #value>
          <span class="power-state">
            <VtsIcon :name="powerState.icon" size="medium" />
            {{ powerState.text }}
          </span>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('ip-address')" :value="vm.mainIpAddress" />
      <VtsQuickInfoRow :label="t('created-on')" :value="installDateFormatted" />
      <VtsQuickInfoRow :label="t('created-by')" :value="user?.email ?? t('unknown')" />
      <VtsQuickInfoRow :label="t('started')" :value="relativeStartTime" />
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('uuid')" :value="vm.id" />
      <VtsQuickInfoRow :label="t('pool')">
        <template #value>
          <span v-if="pool" class="pool-name">
            <VtsIcon name="fa:city" size="medium" />
            <UiLink :to="`/pool/${pool.id}`" size="medium">
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
          <span v-if="host" class="host-name">
            <VtsObjectIcon type="host" :state="hostPowerState" size="medium" />
            <UiLink :to="`/host/${host.id}`" size="medium">
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
      <VtsQuickInfoRow :label="t('guest-tools')" :value="vm.managementAgentDetected ? vm.pvDriversVersion : ''" />
    </VtsQuickInfoColumn>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow :label="t('vcpus')" :value="String(vm.CPUs.number)" />
      <VtsQuickInfoRow :label="t('ram')" :value="`${ram.value} ${ram.prefix}`" />
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
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import { useXoUserResource } from '@/remote-resources/use-xo-user.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import { HOST_POWER_STATE } from '@/types/xo/host.type.ts'
import { VM_POWER_STATE, type XoVm } from '@/types/xo/vm.type.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsQuickInfoCard from '@core/components/quick-info-card/VtsQuickInfoCard.vue'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useTimeAgo } from '@core/composables/locale-time-ago.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useMapper } from '@core/packages/mapper'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { parseDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t, locale } = useI18n()

const { areVmsReady, getVmHost } = useXoVmCollection()
const { isMasterHost } = useXoHostCollection()
const { getPoolById } = useXoPoolCollection()
const { user } = useXoUserResource({}, () => vm.creation?.user)

const host = computed(() => getVmHost(vm))

const isMaster = computed(() => {
  if (host.value === undefined) {
    return false
  }

  return isMasterHost(host.value.id)
})

const pool = computed(() => getPoolById(vm.$pool))

const hostPowerState = computed(() => {
  if (host.value === undefined) {
    return 'unknown'
  }

  return host.value.power_state === HOST_POWER_STATE.RUNNING ? 'running' : 'halted'
})

const powerState = useMapper<VM_POWER_STATE, { icon: IconName; text: string }>(
  () => vm.power_state,
  {
    [VM_POWER_STATE.RUNNING]: { icon: 'legacy:running', text: t('vm-status.running') },
    [VM_POWER_STATE.HALTED]: { icon: 'legacy:halted', text: t('vm-status.halted') },
    [VM_POWER_STATE.PAUSED]: { icon: 'legacy:paused', text: t('vm-status.paused') },
    [VM_POWER_STATE.SUSPENDED]: { icon: 'legacy:suspended', text: t('vm-status.suspended') },
  },
  VM_POWER_STATE.RUNNING
)

const ram = computed(() => formatSizeRaw(vm.memory.size, 1))

const vmTimeAgo = useTimeAgo(() => new Date(parseDateTime((vm.startTime ?? 0) * 1000)))

const relativeStartTime = computed(() => {
  if (!vm.startTime || vm.power_state === VM_POWER_STATE.HALTED) {
    return t('not-running')
  }

  return vmTimeAgo.value
})

const installDateFormatted = computed(() => {
  if (!vm.installTime) {
    return t('unknown')
  }

  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(
    new Date(parseDateTime(vm.installTime * 1000))
  )
})

const virtualizationType = computed(() =>
  vm.virtualizationMode === 'hvm' && vm.pvDriversDetected ? 'pvhvm' : vm.virtualizationMode
)
</script>

<style lang="postcss" scoped>
.vm-dashboard-quick-info {
  .power-state,
  .host-name,
  .pool-name {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
}
</style>
