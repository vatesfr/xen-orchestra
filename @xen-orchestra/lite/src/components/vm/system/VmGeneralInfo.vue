<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="vm.name_label" />
      <VtsTabularKeyValueRow :label="t('id')" :value="vm.uuid" />
      <VtsTabularKeyValueRow :label="t('description')" :value="vm.name_description" />
      <VtsTabularKeyValueRow :label="t('tags')">
        <template v-if="vm.tags.length > 0" #value>
          <UiTagsList>
            <UiTag v-for="tag in vm.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
          </UiTagsList>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('os-name')" :value="guestMetrics?.os_version.name" />
      <VtsTabularKeyValueRow :label="t('os-kernel')" :value="guestMetrics?.os_version.uname" />
      <VtsTabularKeyValueRow :label="t('management-agent-version')" :value="pvVersion" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
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
