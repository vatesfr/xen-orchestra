import { useVdfMembership } from '@/modules/vdf/composables/vdf-membership.composable.ts'
import { VDF_QUARANTINE_TAG } from '@/modules/vdf/types.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { MenuItemAccent } from '@core/components/menu/MenuItem.vue'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import { useInfoModal } from '@core/composables/modals/use-info-modal.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export function isVmQuarantined(vm: Pick<FrontXoVm, 'tags'>) {
  return vm.tags.includes(VDF_QUARANTINE_TAG)
}

// Quarantine and release wherever an incident is seen (the VM's firewall
// page and header menu, Live, rule log): one confirmation, one tag job.
// Given the page's membership (whose `tagError` it shows), failures are
// left to it; otherwise they open a modal.
export function useVdfQuarantine(membership?: ReturnType<typeof useVdfMembership>) {
  const { t } = useI18n()

  const { setQuarantine, isUpdatingTags, tagError } = membership ?? useVdfMembership()

  // the VM being (un)tagged, for its row's busy state
  const pendingVmId = ref<string>()

  const { open: openQuarantine } = useOverlay({
    component: () => import('@/modules/vdf/components/vm/VdfQuarantineModal.vue'),
    events: { onConfirm: true, onCancel: true },
  })

  const { open: openInfoModal } = useInfoModal()

  // resolves to whether the tag was written
  async function confirmQuarantine(vm: FrontXoVm, quarantine = !isVmQuarantined(vm)) {
    const response = await openQuarantine({ props: { vmName: vm.name_label, release: !quarantine } })

    if (response.event !== 'onConfirm') {
      return false
    }

    pendingVmId.value = vm.id

    try {
      await setQuarantine(vm, quarantine)

      return true
    } catch {
      if (membership === undefined) {
        openInfoModal({
          props: {
            title: t('firewall:vm:tags-failed', { vm: vm.name_label }),
            content: tagError.value ?? '',
            icon: 'status:danger-circle',
          },
        })
      }

      return false
    } finally {
      pendingVmId.value = undefined
    }
  }

  // a row's menu entry; `named`: the label names the VM (when the row is
  // about something else, a connection or a log entry)
  function quarantineAction(vm: FrontXoVm, { named = false } = {}): LeafActionItem & { accent: MenuItemAccent } {
    const release = isVmQuarantined(vm)

    return {
      label: named
        ? t(release ? 'firewall:vm:release-vm' : 'firewall:vm:quarantine-vm', { vm: vm.name_label })
        : t(release ? 'firewall:vm:release-action' : 'firewall:vm:quarantine-action'),
      icon: release ? 'fa:lock-open' : 'fa:lock',
      accent: release ? 'brand' : 'danger',
      busy: isUpdatingTags.value && pendingVmId.value === vm.id,
      // not awaited: menus show a click as busy until it settles, and this one
      // waits on the confirmation; `busy` above covers the tag write
      onClick: () => {
        void confirmQuarantine(vm, !release)
      },
    }
  }

  return { confirmQuarantine, quarantineAction, isUpdatingTags, pendingVmId }
}
