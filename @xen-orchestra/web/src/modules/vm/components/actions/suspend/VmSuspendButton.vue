<template>
  <MenuItem
    v-if="canDisplay"
    accent="neutral"
    :disabled="!canSuspend"
    icon="fa:moon"
    :busy="isRunning"
    @click="suspendJob()"
  >
    {{ t('action:suspend') }}
    <i v-if="!canSuspend" class="em-dash-prefix">{{ t('vm-tools-missing') }}</i>
  </MenuItem>
</template>

<script setup lang="ts">
import { useXo5VmRoute } from '@/modules/vm/composables/xo-vm-route-xo5.composable.ts'
import { useXoVmSuspendJob } from '@/modules/vm/jobs/xo-vm-suspend.jobs.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isVmAllowingOperation, isVmMissingGuestToolsFor } from '@/modules/vm/utils/xo-vm.util.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { VM_OPERATIONS } from '@vates/types'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { run: suspend, canRun, isRunning } = useXoVmSuspendJob(() => [vm])
const { xo5VmAdvancedHref } = useXo5VmRoute(() => vm)

const canSuspend = computed(() => !isVmMissingGuestToolsFor(vm, VM_OPERATIONS.SUSPEND))

const canDisplay = computed(() => canRun.value || isVmAllowingOperation(vm, VM_OPERATIONS.SUSPEND))

const closeMenu = inject(IK_CLOSE_MENU, undefined)

const { open: openBlockedModal } = useBlockedModal()

function suspendJob() {
  if (!canRun.value) {
    return openBlockedModal({ props: { blockedOperation: 'suspend', href: xo5VmAdvancedHref.value } })
  }

  suspend()
  closeMenu?.()
}
</script>
