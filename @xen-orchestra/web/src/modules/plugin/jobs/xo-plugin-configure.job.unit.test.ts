import { useXoPluginConfigureJob } from '@/modules/plugin/jobs/xo-plugin-configure.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { fetchPut } from '@/shared/utils/fetch.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
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

const configurablePlugin = createPlugin({ configurationSchema: { type: 'object' } })

function mountConfigureJob(plugin: FrontXoPlugin | undefined, configuration?: unknown) {
  return mountComposable(() => useXoPluginConfigureJob(plugin, configuration)).wrapper.vm
}

describe('run', () => {
  it('saves the configuration of the plugin', async () => {
    await mountConfigureJob(configurablePlugin, { host: 'smtp.example.org' }).run()

    expect(put).toHaveBeenCalledWith('plugins/transport-email/configuration', { host: 'smtp.example.org' })
  })

  it('saves an empty configuration when there is none', async () => {
    await mountConfigureJob(configurablePlugin, undefined).run()

    expect(put).toHaveBeenCalledWith('plugins/transport-email/configuration', {})
  })

  it('propagates the error of the request', async () => {
    const error = new Error('invalid configuration')
    put.mockRejectedValue(error)

    await expect(mountConfigureJob(configurablePlugin).run()).rejects.toBe(error)
  })
})

describe('validate', () => {
  it('can run on a plugin with a configuration schema', () => {
    const job = mountConfigureJob(configurablePlugin)

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run without plugin', () => {
    const job = mountConfigureJob(undefined)

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-configure:missing-plugin'))
  })

  it('cannot run on a plugin which is not configurable', () => {
    const job = mountConfigureJob(createPlugin({ configurationSchema: undefined }))

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:plugin-configure:not-configurable'))
  })

  it('cannot run while the configuration is being saved', () => {
    put.mockReturnValue(new Promise(() => {}))
    const job = mountConfigureJob(configurablePlugin)

    void job.run()

    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:edit:in-progress'))
  })
})
