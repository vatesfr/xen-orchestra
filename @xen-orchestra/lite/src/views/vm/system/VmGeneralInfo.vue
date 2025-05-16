<template>
  <UiCard class="vm-general-info">
    <UiTitle>
      {{ $t('general-information') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('name')" :value="vm.name_label" />
    <VtsQuickInfoRow :label="$t('id')" :value="vm.uuid" />
    <VtsQuickInfoRow :label="$t('description')" :value="vm.name_description" />
    <VtsQuickInfoRow :label="$t('tags')">
      <template v-if="vm.tags.length > 0" #value>
        <UiTagsList>
          <UiTag v-for="tag in vm.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
        </UiTagsList>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('os-name')" :value="vm.reference_label" />
    <VtsQuickInfoRow :label="$t('os-kernel')" :value="guestMetrics?.os_version.uname" />
    <VtsQuickInfoRow :label="$t('management-agent-version')" :value="pvVersion" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'

const { vm } = defineProps<{ vm: XenApiVm }>()

const { getByOpaqueRef } = useVmGuestMetricsStore().subscribe()

const guestMetrics = computed(() => getByOpaqueRef(vm.guest_metrics))
const pvVersion = computed(() => {
  if (!guestMetrics?.value) {
    return
  }

  const { build, major, micro, minor } = guestMetrics.value?.PV_drivers_version

  if (!major || !minor) {
    return
  }

  return `${major}.${minor}.${micro}${build ? `-${build}` : ''}`
})
</script>
