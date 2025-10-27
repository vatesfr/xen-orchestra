<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <UiLabelValue :label="t('name')" :value="vm.name_label" />
    <UiLabelValue :label="t('id')" :value="vm.uuid" />
    <UiLabelValue :label="t('description')" :value="vm.name_description" />
    <UiLabelValue :label="t('tags')" :value="vm.tags" />
    <UiLabelValue :label="t('os-name')" :value="guestMetrics?.os_version.name" />
    <UiLabelValue :label="t('os-kernel')" :value="guestMetrics?.os_version.uname" />
    <UiLabelValue :label="t('management-agent-version')" :value="pvVersion" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: XenApiVm }>()

const { t } = useI18n()

const { getByOpaqueRef } = useVmGuestMetricsStore().subscribe()

const guestMetrics = computed(() => getByOpaqueRef(vm.guest_metrics))
const pvVersion = computed(() => {
  if (guestMetrics.value === undefined) {
    return
  }

  const { build, major, micro, minor } = guestMetrics.value.PV_drivers_version

  if (!major || !minor) {
    return
  }

  return `${major}.${minor}.${micro ? `${micro}` : ''}.${build ? `-${build}` : ''}`
})
</script>
