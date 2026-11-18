import { useXoSshKeyDeleteJob } from '@/modules/account/jobs/xo-ssh-key-delete.job.ts'
import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoUser } from '@vates/types'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useSshKeyDelete(rawUser: MaybeRefOrGetter<XoUser>, rawSshKeys: MaybeRefOrGetter<SshKey[]>) {
  const user = toComputed(rawUser)
  const sshKeys = toComputed(rawSshKeys)

  const { t } = useI18n()

  const { $context } = useXoUserResource({}, () => 'me')

  const {
    run,
    canRun: canDeleteSshKeys,
    isRunning: isDeletingSshKeys,
    errorMessage: deleteSshKeysErrorMessage,
  } = useXoSshKeyDeleteJob(user, sshKeys)

  function remove() {
    run({ detached: true, onSuccess: () => $context.forceReload() })
  }

  const { open: openDeleteModal } = useDeleteModal()

  const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

  function deleteSshKeys() {
    const count = sshKeys.value.length

    if (count === 1) {
      return openDeleteModal({
        props: {
          subject: sshKeys.value[0]?.title || t('n-ssh-keys', 1),
          confirmLabel: t('action:delete'),
        },
        events: {
          onConfirm: remove,
        },
      })
    }

    return openTypeToConfirmModal({
      props: {
        accent: 'warning',
        icon: 'status:warning-picto',
        title: t('modal:ssh-key-delete-title', { n: count }),
        description: t('modal:ssh-key-delete-message'),
        confirmationText: t('n-ssh-keys', { n: count }),
        confirmLabel: t('action:delete-n-ssh-keys', { n: count }),
      },
      events: {
        onConfirm: remove,
      },
    })
  }

  return {
    deleteSshKeys,
    canDeleteSshKeys,
    isDeletingSshKeys,
    deleteSshKeysErrorMessage,
  }
}
