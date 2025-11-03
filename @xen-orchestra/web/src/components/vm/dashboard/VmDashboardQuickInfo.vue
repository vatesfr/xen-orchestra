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
      <VtsQuickInfoRow :label="t('ram')" :value="`${ram?.value} ${ram?.prefix}`" />
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
import { useXoVmUtils } from '@/composables/xo-vm-utils.composable.ts'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import { useXoUserResource } from '@/remote-resources/use-xo-user.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import { getRam } from '@/utils/xo-records/vm.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsQuickInfoCard from '@core/components/quick-info-card/VtsQuickInfoCard.vue'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { type XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { areVmsReady } = useXoVmCollection()
const { useGetPoolById } = useXoPoolCollection()

const { powerState, host, isMaster, hostPowerState, installDateFormatted, relativeStartTime } = useXoVmUtils(() => vm)

const { user } = useXoUserResource({}, () => vm.creation?.user)

const pool = useGetPoolById(vm.$pool)

const ram = computed(() => getRam(vm))

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
