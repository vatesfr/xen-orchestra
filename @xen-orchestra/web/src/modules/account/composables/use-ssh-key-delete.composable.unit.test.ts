import { useSshKeyDelete } from '@/modules/account/composables/use-ssh-key-delete.composable.ts'
import type { useXoSshKeyDeleteJob } from '@/modules/account/jobs/xo-ssh-key-delete.job.ts'
import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createUser } from '@/test/create-user.ts'
import { t } from '@/test/i18n.ts'
import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { xoUserMock } from '@/test/mock-xo-user.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'

const { run, useDeleteJob, openTypeToConfirmModal } = vi.hoisted(() => ({
  run: vi.fn(),
  useDeleteJob: vi.fn(),
  openTypeToConfirmModal: vi.fn(),
}))

vi.mock(import('@/modules/account/jobs/xo-ssh-key-delete.job.ts'), () => ({
  useXoSshKeyDeleteJob: useDeleteJob as unknown as typeof useXoSshKeyDeleteJob,
}))

vi.mock(import('@/modules/user/remote-resources/use-xo-user.ts'), () => import('@/test/mock-xo-user.ts'))

vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

vi.mock(import('@core/composables/modals/use-type-to-confirm-modal.ts'), () => ({
  useTypeToConfirmModal: (() => ({ open: openTypeToConfirmModal })) as unknown as typeof useTypeToConfirmModal,
}))

beforeEach(() => {
  run.mockReset()
  useDeleteJob.mockReset().mockReturnValue(createJobResult(run))
  deleteModalMock.reset()
  openTypeToConfirmModal.mockReset()
  xoUserMock.reset()
})

const user = createUser()
const laptopKey: SshKey = { title: 'Laptop', key: 'ssh-ed25519 AAAA laptop' }
const desktopKey: SshKey = { title: 'Desktop', key: 'ssh-ed25519 BBBB desktop' }

function mountDelete(sshKeys: SshKey[] = [laptopKey]) {
  return mountComposable(() => useSshKeyDelete(user, sshKeys)).wrapper.vm
}

describe('deleteSshKeys', () => {
  it('asks to confirm the deletion of a single SSH key, shown by its title', () => {
    mountDelete([laptopKey]).deleteSshKeys()

    expect(deleteModalMock.open.mock.calls[0][0].props).toEqual({
      subject: 'Laptop',
      confirmLabel: t('action:delete'),
    })
    expect(openTypeToConfirmModal).not.toHaveBeenCalled()
  })

  it('shows a generic subject for a single SSH key without a title', () => {
    mountDelete([{ title: '', key: 'ssh-ed25519 CCCC' }]).deleteSshKeys()

    expect(deleteModalMock.open.mock.calls[0][0].props.subject).toBe(t('n-ssh-keys', 1))
  })

  it('asks to type the number of SSH keys to confirm the deletion of several SSH keys', () => {
    mountDelete([laptopKey, desktopKey]).deleteSshKeys()

    expect(openTypeToConfirmModal.mock.calls[0][0].props).toEqual({
      accent: 'warning',
      icon: 'status:warning-picto',
      title: t('modal:ssh-key-delete-title', { n: 2 }),
      description: t('modal:ssh-key-delete-message'),
      confirmationText: t('n-ssh-keys', { n: 2 }),
      confirmLabel: t('action:delete-n-ssh-keys', { n: 2 }),
    })
    expect(deleteModalMock.open).not.toHaveBeenCalled()
  })

  it('does not delete anything until confirmed', () => {
    mountDelete().deleteSshKeys()

    expect(run).not.toHaveBeenCalled()
  })

  it.each([
    ['a single SSH key', [laptopKey], deleteModalMock.open],
    ['several SSH keys', [laptopKey, desktopKey], openTypeToConfirmModal],
  ])('deletes %s in the background once confirmed, so the modal closes right away', (_label, sshKeys, openModal) => {
    mountDelete(sshKeys).deleteSshKeys()

    openModal.mock.calls[0][0].events.onConfirm()

    expect(run).toHaveBeenCalledWith({ detached: true, onSuccess: expect.any(Function) })
  })

  it('reloads the user once the SSH keys are deleted', () => {
    mountDelete().deleteSshKeys()
    deleteModalMock.confirm()

    expect(xoUserMock.forceReload).not.toHaveBeenCalled()

    run.mock.calls[0][0].onSuccess()

    expect(xoUserMock.forceReload).toHaveBeenCalledOnce()
  })
})

describe('job', () => {
  it('runs on the user and the SSH keys', () => {
    mountDelete([laptopKey, desktopKey])

    const [jobUser, jobSshKeys] = useDeleteJob.mock.calls[0]

    expect(jobUser.value).toEqual(user)
    expect(jobSshKeys.value).toEqual([laptopKey, desktopKey])
  })

  it('exposes whether the SSH keys can be deleted, are being deleted, and why they cannot be', () => {
    useDeleteJob.mockReturnValue(createJobResult(run, { canRun: false, isRunning: true, errorMessage: 'In progress' }))

    const result = mountDelete()

    expect(result.canDeleteSshKeys).toBe(false)
    expect(result.isDeletingSshKeys).toBe(true)
    expect(result.deleteSshKeysErrorMessage).toBe('In progress')
  })
})
