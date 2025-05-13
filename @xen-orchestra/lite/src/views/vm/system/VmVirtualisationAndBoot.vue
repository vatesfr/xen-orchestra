<template>
  <UiCard class="vm-virtualisation-and-boot">
    <UiTitle>
      {{ $t('virtualization-boot-settings') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('virtualization-mode')" :value="virtualizationMode" />
    <VtsQuickInfoRow :label="$t('secure-boot')">
      <template #value>
        <UiInfo :accent="vm.platform.secureBoot ? 'success' : 'muted'">
          {{ vm.platform.secureBoot ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('virtual-tpm')" :value="vm.VTPMs.join(', ')" />
    <VtsQuickInfoRow :label="$t('viridian')">
      <template #value>
        <UiInfo :accent="vm.platform.viridian === 'true' ? 'success' : 'muted'">
          {{ vm.platform.viridian === 'true' ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('manage-citrix-pv-drivers-via-windows-update')" class="text-ellipsis">
      <template #value>
        <UiInfo :accent="vm.has_vendor_device ? 'success' : 'muted'">
          {{ vm.has_vendor_device ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('nested-virtualization')">
      <template #value>
        <UiInfo :accent="NestedVirtEnabled ? 'success' : 'muted'">
          {{ NestedVirtEnabled ? $t('enabled') : $t('disabled') }}
        </UiInfo>
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
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { satisfies } from 'semver'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XenApiVm }>()

const { pool } = usePoolStore().subscribe()
const { getByOpaqueRef: getHost } = useHostStore().subscribe()

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

const NestedVirtEnabled = computed(() => {
  const poolMaster = pool.value ? getHost(pool.value.master)?.software_version.platform_version : undefined
  return satisfies(poolMaster ?? '', '>=3.4')
})
</script>
