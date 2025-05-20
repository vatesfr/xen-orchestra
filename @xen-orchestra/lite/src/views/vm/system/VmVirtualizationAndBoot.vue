<template>
  <UiCard>
    <UiTitle>
      {{ $t('virtualization-boot-settings') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('virtualization-mode')" :value="virtualizationMode" />
    <VtsQuickInfoRow :label="$t('secure-boot')">
      <template #value>
        <VtsEnabledState :enabled="vm.platform.secureBoot !== undefined" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('virtual-tpm')" :value="vm.VTPMs.length > 0 ? vm.VTPMs.join(', ') : $t('none')" />
    <VtsQuickInfoRow :label="$t('viridian')">
      <template #value>
        <VtsEnabledState :enabled="vm.platform.viridian === 'true'" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('manage-citrix-pv-drivers-via-windows-update')">
      <template #value>
        <VtsEnabledState :enabled="vm.has_vendor_device" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('nested-virtualization')">
      <template #value>
        <VtsEnabledState :enabled="isNestedVirtualizationEnabled" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import VtsEnabledState from '@core/enabled-state/VtsEnabledState.vue'
import { satisfies } from 'semver'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XenApiVm }>()

const { pool } = usePoolStore().subscribe()
const { getByOpaqueRef } = useHostStore().subscribe()

/**
 * @see `packages/xo-server/src/xapi/utils.mjs`:57
 **/
const virtualizationMode = computed(() =>
  vm.domain_type !== undefined && vm.domain_type !== 'unspecified'
    ? vm.domain_type
    : vm.HVM_boot_policy === ''
      ? 'pv'
      : 'hvm'
)

const isNestedVirtualizationEnabled = computed(() => {
  const poolMaster = pool.value !== undefined ? getByOpaqueRef(pool.value.master) : undefined

  if (poolMaster === undefined) {
    return false
  }

  return satisfies(poolMaster.software_version.platform_version, '>=3.4')
    ? vm.platform['nested-virt'] === 'true' || vm.platform['exp-nested-hvm'] === 'true'
    : false
})
</script>
