<template>
  <MenuItem icon="action:delete" :busy="isRunning" class="delete" @click="openModal()">
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmDeleteJob } from '@/modules/vm/jobs/xo-vm-delete.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { extractVmHostId } from '@/modules/vm/utils/xo-vm.util.ts'
import { useRedirectAfterDelete } from '@/shared/composables/redirect-after-delete.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { run: deleteVM, canRun, isRunning } = useXoVmDeleteJob(() => [vm])

const { xo5VmAdvancedHref } = useXoVmUtils(() => vm)

const route = useRoute()

const { redirectIfOnObjectPage } = useRedirectAfterDelete({
  isOnObjectPage: () => route.name?.includes('/vm/') ?? false,
  redirectTo: () => {
    const hostId = extractVmHostId(vm)

    if (hostId !== undefined) {
      return { name: '/host/[id]/vms', params: { id: hostId } }
    }

    return { name: '/pool/[id]/vms', params: { id: vm.$pool } }
  },
})

const { open: openDeleteModal } = useDeleteModal()

const { open: openBlockedModal } = useBlockedModal()

function openModal() {
  if (!canRun.value) {
    return openBlockedModal({
      props: {
        blockedOperation: 'destroy',
        href: xo5VmAdvancedHref.value,
      },
    })
  }

  openDeleteModal({
    events: {
      onConfirm: async () => {
        let result

        try {
          result = await deleteVM()
        } catch (error) {
          console.error('Error when deleting VM:', error)
        }

        await redirectIfOnObjectPage(result)
      },
    },
    props: {
      subject: t('n-vms', { n: 1 }),
      confirmLabel: t('action:delete-n-vms', { n: 1 }),
    },
  })
}
</script>

<style lang="postcss" scoped>
.delete {
  color: var(--color-danger-item-base);
}
</style>
