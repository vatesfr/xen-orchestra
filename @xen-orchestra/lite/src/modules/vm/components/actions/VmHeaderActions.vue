<template>
  <VtsHeadBarActions v-slot="{ isInline }" :actions="quickActions">
    <VmPowerStateActionButton v-if="isInline.start" :action="powerStateActions.start" />
    <VmPowerStateActionButton v-if="isInline.resume" :action="powerStateActions.resume" />
    <VmPowerStateActionButton v-if="isInline.shutdown" :action="powerStateActions.shutdown" />
    <VmPowerStateActionButton v-if="isInline['force-shutdown']" :action="powerStateActions['force-shutdown']" />
    <VmPowerStateActionButton v-if="isInline.reboot" :action="powerStateActions.reboot" />
    <VmPowerStateActionButton v-if="isInline['force-reboot']" :action="powerStateActions['force-reboot']" />
    <VmActionMigrateItem v-if="isInline.migrate" :selected-refs="vmRefs" is-single-action />
    <VmActionSnapshotItem v-if="isInline.snapshot" :vm-refs />
    <VtsActionsMenu :label="t('more-actions')" size="medium" no-section-title>
      <VtsMenuTitle>{{ t('action:change-state') }}</VtsMenuTitle>
      <VmActionPowerStateItems :vm-refs :exclude="isInline" />
      <VtsMenuTitle>{{ t('actions') }}</VtsMenuTitle>
      <VmActionMigrateItem v-if="!isInline.migrate" :selected-refs="vmRefs" is-single-action />
      <VmActionSnapshotItem v-if="!isInline.snapshot" :vm-refs />
      <VmActionCopyItem :selected-refs="vmRefs" is-single-action />
      <VmActionExportItem :vm-refs is-single-action />
    </VtsActionsMenu>
  </VtsHeadBarActions>
</template>

<script lang="ts" setup>
import VmActionCopyItem from '@/components/vm/VmActionItems/VmActionCopyItem.vue'
import VmActionExportItem from '@/components/vm/VmActionItems/VmActionExportItem.vue'
import VmActionMigrateItem from '@/components/vm/VmActionItems/VmActionMigrateItem.vue'
import VmActionPowerStateItems from '@/components/vm/VmActionItems/VmActionPowerStateItems.vue'
import VmActionSnapshotItem from '@/components/vm/VmActionItems/VmActionSnapshotItem.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VmPowerStateActionButton from '@/modules/vm/components/actions/VmPowerStateActionButton.vue'
import { useVmPowerStateActions } from '@/modules/vm/composables/vm-power-state-actions.composable.ts'
import { areVmToolsDetected, getVmQuickActions } from '@/modules/vm/utils/vm.util.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import VtsHeadBarActions from '@core/components/head-bar/VtsHeadBarActions.vue'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import VtsMenuTitle from '@core/components/menu/VtsMenuTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XenApiVm
}>()

const { t } = useI18n()

const vmRefs = computed(() => [vm.$ref])

const { getByOpaqueRef: getGuestMetrics } = useVmGuestMetricsStore().subscribe()

const areToolsDetected = computed(() => areVmToolsDetected(getGuestMetrics(vm.guest_metrics)))

const quickActions = computed(() => getVmQuickActions(vm, areToolsDetected.value))

const { actions: powerStateActions } = useVmPowerStateActions(vmRefs)
</script>
