import { useInstallUpdate } from '@/modules/appliance/composables/use-install-update.composable.ts'
import type { InstallUpdatePayload } from '@/modules/appliance/form/install-update/use-install-update-form.ts'
import { useXoaSnapshotJob } from '@/modules/appliance/jobs/xoa-snapshot.job.ts'
import { useXoaUpgradeJob } from '@/modules/appliance/jobs/xoa-upgrade.job.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { mockOverlay, overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { flushPromises } from '@vue/test-utils'

type InstallUpdateDrawerOverlay = {
  events: {
    onConfirm: (payload: InstallUpdatePayload) => unknown
    onCancel: true
  }
}

const snapshotJob = createJobStub(useXoaSnapshotJob)

const upgradeJob = createJobStub(useXoaUpgradeJob)

const onUpgraded = vi.fn()

mockOverlay()

const VERSIONS = { channel: 'stable', currentVersion: '5.100.0', nextVersion: '5.101.0' }

beforeEach(() => {
  snapshotJob.reset()
  upgradeJob.reset()
  overlayMock.reset()
  onUpgraded.mockReset()

  silenceConsoleError()
})

function mountInstallUpdate() {
  return mountComposable(() => useInstallUpdate(VERSIONS, onUpgraded)).wrapper.vm
}

function getDrawer() {
  return overlayMock.getOverlay<InstallUpdateDrawerOverlay>()
}

async function confirmDrawer(payload: InstallUpdatePayload) {
  const response = getDrawer().events.onConfirm(payload)
  await flushPromises()

  return response
}

describe('isInstallingUpdate', () => {
  it('is false when neither the snapshot nor the upgrade is running', () => {
    expect(mountInstallUpdate().isInstallingUpdate).toBe(false)
  })

  it('is true while the snapshot is running', () => {
    snapshotJob.setState({ isRunning: true })

    expect(mountInstallUpdate().isInstallingUpdate).toBe(true)
  })

  it('is true while the upgrade is running', () => {
    upgradeJob.setState({ isRunning: true })

    expect(mountInstallUpdate().isInstallingUpdate).toBe(true)
  })
})

describe('openInstallUpdateDrawer', () => {
  it('opens the drawer with the versions', () => {
    mountInstallUpdate().openInstallUpdateDrawer()

    expect(getDrawer().open).toHaveBeenCalledWith({ props: expect.objectContaining(VERSIONS) })
  })
})

describe('drawer', () => {
  it('closes the drawer when it is cancelled', () => {
    mountInstallUpdate()

    expect(getDrawer().events.onCancel).toBe(true)
  })

  it('closes the drawer without waiting for the installation', () => {
    snapshotJob.run.mockReturnValue(new Promise(() => {}))
    mountInstallUpdate()

    expect(getDrawer().events.onConfirm({ snapshot: true })).toBeUndefined()
  })

  it('takes a snapshot before running the detached upgrade', async () => {
    snapshotJob.run.mockImplementation(async () => expect(upgradeJob.run).not.toHaveBeenCalled())
    mountInstallUpdate()

    await confirmDrawer({ snapshot: true })

    expect(snapshotJob.run).toHaveBeenCalledOnce()
    expect(upgradeJob.run).toHaveBeenCalledWith({ detached: true, onSuccess: onUpgraded })
  })

  it('runs the detached upgrade without snapshot when none is asked', async () => {
    mountInstallUpdate()

    await confirmDrawer({ snapshot: false })

    expect(snapshotJob.run).not.toHaveBeenCalled()
    expect(upgradeJob.run).toHaveBeenCalledWith({ detached: true, onSuccess: onUpgraded })
  })

  it('does not run the upgrade when the snapshot fails', async () => {
    snapshotJob.run.mockRejectedValue(new Error('snapshot failed'))
    mountInstallUpdate()

    await confirmDrawer({ snapshot: true })

    expect(upgradeJob.run).not.toHaveBeenCalled()
  })
})
