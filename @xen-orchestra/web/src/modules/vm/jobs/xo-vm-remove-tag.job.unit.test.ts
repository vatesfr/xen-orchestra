import { useXoVmRemoveTagJob } from '@/modules/vm/jobs/xo-vm-remove-tag.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { remove } = vi.hoisted(() => ({
  remove: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchDelete: remove as unknown as typeof fetchDelete,
}))

beforeEach(() => {
  remove.mockReset()

  remove.mockResolvedValue(undefined)
})

const vm = createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['production', 'xo:no-bak=Not/needed?'] })

function mountRemoveTagJob(targetVm: FrontXoVm, tag: string | undefined) {
  return mountComposable(() => useXoVmRemoveTagJob(targetVm, tag)).wrapper.vm
}

describe('run', () => {
  it('removes the tag from the VM', async () => {
    await mountRemoveTagJob(vm, 'production').run()

    expect(remove).toHaveBeenCalledWith('vms/vm-42/tags/production')
  })

  it('encodes the tag in the URL', async () => {
    await mountRemoveTagJob(vm, 'xo:no-bak=Not/needed?').run()

    expect(remove).toHaveBeenCalledWith('vms/vm-42/tags/xo%3Ano-bak%3DNot%2Fneeded%3F')
  })

  it('propagates the error of the request', async () => {
    const error = new Error('request failed')
    remove.mockRejectedValue(error)

    await expect(mountRemoveTagJob(vm, 'production').run()).rejects.toBe(error)
  })
})

describe('validate', () => {
  it('can run with a tag the VM has', () => {
    const job = mountRemoveTagJob(vm, 'production')

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without tag', () => {
    const job = mountRemoveTagJob(vm, undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:vm-tag:missing-tag'))
  })

  it('cannot run with a blank tag', () => {
    const job = mountRemoveTagJob(vm, '   ')

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:vm-tag:missing-tag'))
  })

  it('cannot run with a tag the VM does not have', () => {
    const job = mountRemoveTagJob(vm, 'staging')

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:vm-remove-tag:not-present'))
  })

  it('cannot run while the tag is being removed', () => {
    remove.mockReturnValue(new Promise(() => {}))
    const job = mountRemoveTagJob(vm, 'production')

    void job.run()

    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:vm-remove-tag:in-progress'))
  })
})
