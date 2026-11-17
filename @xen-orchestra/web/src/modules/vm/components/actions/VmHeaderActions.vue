<template>
  <VtsHeadBarActions v-slot="{ isInline }" :actions="quickActions">
    <VmStartButton v-if="isInline.start" :vm />
    <VmUnpauseButton v-if="isInline.unpause" :vm />
    <VmResumeButton v-if="isInline.resume" :vm />
    <VmShutdownButton v-if="isInline.shutdown" :vm />
    <VmForceShutdownButton v-if="isInline['force-shutdown']" :vm />
    <VmRebootButton v-if="isInline.reboot" :vm />
    <VmForceRebootButton v-if="isInline['force-reboot']" :vm />
    <VmMigrateButton v-if="isInline.migrate" :vm />
    <VmSnapshotButton v-if="isInline.snapshot" :vm />
    <VtsActionsMenu :label="t('more-actions')" size="medium" no-section-title>
      <MenuItem accent="brand">
        <UiLink class="link" size="small" :href="xo5VmGeneralHref">
          {{ t('action:manage-in-xo-5') }}
        </UiLink>
      </MenuItem>
      <VmMoreActions :vm layout="sections" :exclude="isInline" />
    </VtsActionsMenu>
  </VtsHeadBarActions>
</template>

<script lang="ts" setup>
import VmMigrateButton from '@/modules/vm/components/actions/migrate/VmMigrateButton.vue'
import VmForceRebootButton from '@/modules/vm/components/actions/reboot/VmForceRebootButton.vue'
import VmRebootButton from '@/modules/vm/components/actions/reboot/VmRebootButton.vue'
import VmResumeButton from '@/modules/vm/components/actions/resume/VmResumeButton.vue'
import VmForceShutdownButton from '@/modules/vm/components/actions/shutdown/VmForceShutdownButton.vue'
import VmShutdownButton from '@/modules/vm/components/actions/shutdown/VmShutdownButton.vue'
import VmSnapshotButton from '@/modules/vm/components/actions/snapshot/VmSnapshotButton.vue'
import VmStartButton from '@/modules/vm/components/actions/start/VmStartButton.vue'
import VmUnpauseButton from '@/modules/vm/components/actions/unpause/VmUnpauseButton.vue'
import VmMoreActions from '@/modules/vm/components/actions/VmMoreActions.vue'
import { useXo5VmRoute } from '@/modules/vm/composables/xo-vm-route-xo5.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmQuickActions } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsHeadBarActions from '@core/components/head-bar/VtsHeadBarActions.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { xo5VmGeneralHref } = useXo5VmRoute(() => vm)

const quickActions = computed(() => getVmQuickActions(vm))
</script>

<style lang="postcss" scoped>
.link {
  text-decoration: none;
  padding-block: 1.2rem;
  flex-grow: 1;
}
</style>
