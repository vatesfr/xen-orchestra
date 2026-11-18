import { useXoVmEditTagsJob } from '@/modules/vm/jobs/xo-vm-edit-tags.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { fetchDelete, fetchPut } from '@/shared/utils/fetch.util.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { TagSelectChanges } from '@core/components/tag-select/VtsTagSelect.vue'

const { put, remove } = vi.hoisted(() => ({
  put: vi.fn(),
  remove: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPut: put as unknown as typeof fetchPut,
  fetchDelete: remove as unknown as typeof fetchDelete,
}))

beforeEach(() => {
  put.mockReset()
  remove.mockReset()

  put.mockResolvedValue(undefined)
  remove.mockResolvedValue(undefined)
})

const vm = createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['production', 'web'] })

const failure = new Error('VM unreachable')

function mountEditTagsJob(targetVm: FrontXoVm, changes: TagSelectChanges | undefined) {
  return mountComposable(() => useXoVmEditTagsJob(targetVm, changes)).wrapper.vm
}

describe('run', () => {
  it('adds the added tags and removes the removed ones', async () => {
    await mountEditTagsJob(vm, { added: ['db', 'analytics'], removed: ['web'] }).run()

    expect(put.mock.calls).toEqual([['vms/vm-42/tags/db'], ['vms/vm-42/tags/analytics']])
    expect(remove.mock.calls).toEqual([['vms/vm-42/tags/web']])
  })

  it('encodes the tags in the URL', async () => {
    await mountEditTagsJob(vm, { added: ['xo:no-bak=Not/needed?'], removed: ['a b'] }).run()

    expect(put).toHaveBeenCalledWith('vms/vm-42/tags/xo%3Ano-bak%3DNot%2Fneeded%3F')
    expect(remove).toHaveBeenCalledWith('vms/vm-42/tags/a%20b')
  })

  it('still applies the other changes when one of them fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    put.mockImplementation(path => (path === 'vms/vm-42/tags/db' ? Promise.reject(failure) : Promise.resolve()))

    await mountEditTagsJob(vm, { added: ['db', 'analytics'], removed: ['web'] }).run()

    expect(put.mock.calls).toEqual([['vms/vm-42/tags/db'], ['vms/vm-42/tags/analytics']])
    expect(remove.mock.calls).toEqual([['vms/vm-42/tags/web']])
  })

  it('does not reject when a change fails, and logs the failure instead', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    remove.mockRejectedValue(failure)

    const results = await mountEditTagsJob(vm, { added: [], removed: ['web'] }).run()

    expect(results).toEqual([{ status: 'rejected', reason: failure }])
    expect(consoleError).toHaveBeenCalledWith(failure)
  })
})

describe('validate', () => {
  it('can run with tag changes', () => {
    const job = mountEditTagsJob(vm, { added: ['db'], removed: ['web'] })

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without changes', () => {
    const job = mountEditTagsJob(vm, undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:arg:missing-payload'))
  })

  it('cannot run with an empty tag', () => {
    const job = mountEditTagsJob(vm, { added: ['db', ''], removed: [] })

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:vm-tag:missing-tag'))
  })

  it('can remove a whitespace-only tag set from elsewhere', () => {
    const job = mountEditTagsJob(vm, { added: [], removed: ['   '] })

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run while the tags are being edited', () => {
    put.mockReturnValue(new Promise(() => {}))
    const job = mountEditTagsJob(vm, { added: ['db'], removed: [] })

    void job.run()

    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:edit:in-progress'))
  })
})
