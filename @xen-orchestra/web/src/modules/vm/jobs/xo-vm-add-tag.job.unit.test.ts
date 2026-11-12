import { useXoVmAddTagJob } from '@/modules/vm/jobs/xo-vm-add-tag.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { fetchPut } from '@/shared/utils/fetch.util.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { put } = vi.hoisted(() => ({
  put: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPut: put as unknown as typeof fetchPut,
}))

beforeEach(() => {
  put.mockReset()

  put.mockResolvedValue(undefined)
})

const vm = createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['production'] })

function mountAddTagJob(targetVm: FrontXoVm, tag: string | undefined) {
  return mountComposable(() => useXoVmAddTagJob(targetVm, tag)).wrapper.vm
}

describe('run', () => {
  it('adds the tag to the VM', async () => {
    await mountAddTagJob(vm, 'staging').run()

    expect(put).toHaveBeenCalledWith('vms/vm-42/tags/staging')
  })

  it('encodes the tag in the URL', async () => {
    await mountAddTagJob(vm, 'xo:no-bak=Not/needed?').run()

    expect(put).toHaveBeenCalledWith('vms/vm-42/tags/xo%3Ano-bak%3DNot%2Fneeded%3F')
  })

  it('propagates the error of the request', async () => {
    const error = new Error('request failed')
    put.mockRejectedValue(error)

    await expect(mountAddTagJob(vm, 'staging').run()).rejects.toBe(error)
  })
})

describe('validate', () => {
  it('can run with a tag the VM does not have yet', () => {
    const job = mountAddTagJob(vm, 'staging')

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without tag', () => {
    const job = mountAddTagJob(vm, undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:vm-tag:missing-tag'))
  })

  it('cannot run with a blank tag', () => {
    const job = mountAddTagJob(vm, '   ')

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:vm-tag:missing-tag'))
  })

  it('cannot run with a tag the VM already has', () => {
    const job = mountAddTagJob(vm, 'production')

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:vm-add-tag:already-present'))
  })

  it('cannot run while the tag is being added', () => {
    put.mockReturnValue(new Promise(() => {}))
    const job = mountAddTagJob(vm, 'staging')

    void job.run()

    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:vm-add-tag:in-progress'))
  })
})
