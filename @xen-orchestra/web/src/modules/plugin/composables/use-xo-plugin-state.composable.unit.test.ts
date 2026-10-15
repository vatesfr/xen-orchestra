import { useXoPluginState } from '@/modules/plugin/composables/use-xo-plugin-state.composable.ts'
import type { useXoPluginAutoloadJob } from '@/modules/plugin/jobs/xo-plugin-autoload.job.ts'
import type { useXoPluginLoadJob } from '@/modules/plugin/jobs/xo-plugin-load.job.ts'
import type { useXoPluginUnloadJob } from '@/modules/plugin/jobs/xo-plugin-unload.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref, toValue } from 'vue'

const { jobs, useLoadJob, useUnloadJob, useAutoloadJob } = vi.hoisted(() => ({
  jobs: {} as Record<'load' | 'unload' | 'autoload', ReturnType<typeof createJob>>,
  useLoadJob: vi.fn(),
  useUnloadJob: vi.fn(),
  useAutoloadJob: vi.fn(),
}))

vi.mock(import('@/modules/plugin/jobs/xo-plugin-load.job.ts'), () => ({
  useXoPluginLoadJob: useLoadJob as unknown as typeof useXoPluginLoadJob,
}))

vi.mock(import('@/modules/plugin/jobs/xo-plugin-unload.job.ts'), () => ({
  useXoPluginUnloadJob: useUnloadJob as unknown as typeof useXoPluginUnloadJob,
}))

vi.mock(import('@/modules/plugin/jobs/xo-plugin-autoload.job.ts'), () => ({
  useXoPluginAutoloadJob: useAutoloadJob as unknown as typeof useXoPluginAutoloadJob,
}))

function createJob() {
  return {
    run: vi.fn().mockResolvedValue(undefined),
    canRun: ref(true),
    isRunning: ref(false),
    errorMessage: ref<string>(),
  }
}

beforeEach(() => {
  jobs.load = createJob()
  jobs.unload = createJob()
  jobs.autoload = createJob()
  useLoadJob.mockReset().mockReturnValue(jobs.load)
  useUnloadJob.mockReset().mockReturnValue(jobs.unload)
  useAutoloadJob.mockReset().mockReturnValue(jobs.autoload)
})

function mountState(plugin: FrontXoPlugin) {
  return mountComposable(() => useXoPluginState(plugin)).wrapper.vm
}

describe('isLoaded', () => {
  it('is true for a loaded plugin', () => {
    expect(mountState(createPlugin({ loaded: true })).isLoaded).toBe(true)
  })

  it('is false for a plugin never loaded', () => {
    expect(mountState(createPlugin({ loaded: undefined })).isLoaded).toBe(false)
  })
})

describe('toggleLoaded', () => {
  it('unloads a loaded plugin', async () => {
    await mountState(createPlugin({ loaded: true })).toggleLoaded()

    expect({ unload: jobs.unload.run.mock.calls.length, load: jobs.load.run.mock.calls.length }).toEqual({
      unload: 1,
      load: 0,
    })
  })

  it('loads an unloaded plugin', async () => {
    await mountState(createPlugin({ loaded: false })).toggleLoaded()

    expect({ unload: jobs.unload.run.mock.calls.length, load: jobs.load.run.mock.calls.length }).toEqual({
      unload: 0,
      load: 1,
    })
  })
})

describe('canToggleLoaded', () => {
  it('follows the unload job for a loaded plugin', () => {
    jobs.unload.canRun.value = false

    expect(mountState(createPlugin({ loaded: true })).canToggleLoaded).toBe(false)
  })

  it('follows the load job for an unloaded plugin', () => {
    jobs.load.canRun.value = false

    expect(mountState(createPlugin({ loaded: false })).canToggleLoaded).toBe(false)
  })

  it('is false while the autoload is being updated', () => {
    jobs.autoload.isRunning.value = true

    expect(mountState(createPlugin({ loaded: false })).canToggleLoaded).toBe(false)
  })
})

describe('toggleLoadedErrorMessage', () => {
  it('is the error of the unload job for a loaded plugin', () => {
    jobs.load.errorMessage.value = 'load error'
    jobs.unload.errorMessage.value = 'unload error'

    expect(mountState(createPlugin({ loaded: true })).toggleLoadedErrorMessage).toBe('unload error')
  })

  it('is the error of the load job for an unloaded plugin', () => {
    jobs.load.errorMessage.value = 'load error'
    jobs.unload.errorMessage.value = 'unload error'

    expect(mountState(createPlugin({ loaded: false })).toggleLoadedErrorMessage).toBe('load error')
  })
})

describe('isTogglingLoaded', () => {
  it('is false when the plugin is neither loaded nor unloaded', () => {
    expect(mountState(createPlugin()).isTogglingLoaded).toBe(false)
  })

  it('is true while the plugin is being loaded', () => {
    jobs.load.isRunning.value = true

    expect(mountState(createPlugin({ loaded: false })).isTogglingLoaded).toBe(true)
  })

  it('is true while the plugin is being unloaded', () => {
    jobs.unload.isRunning.value = true

    expect(mountState(createPlugin()).isTogglingLoaded).toBe(true)
  })
})

describe('toggleAutoload', () => {
  it('updates the autoload to the opposite of the current one', async () => {
    const state = mountState(createPlugin({ autoload: true }))

    await state.toggleAutoload()

    expect({ autoload: toValue(useAutoloadJob.mock.calls[0][1]), runs: jobs.autoload.run.mock.calls.length }).toEqual({
      autoload: false,
      runs: 1,
    })
  })
})

describe('canToggleAutoload', () => {
  it('is true when the autoload job can run', () => {
    expect(mountState(createPlugin()).canToggleAutoload).toBe(true)
  })

  it('is false when the autoload job cannot run', () => {
    jobs.autoload.canRun.value = false

    expect(mountState(createPlugin()).canToggleAutoload).toBe(false)
  })

  it('is false while the plugin is being loaded or unloaded', () => {
    jobs.load.isRunning.value = true

    expect(mountState(createPlugin()).canToggleAutoload).toBe(false)
  })
})

describe('error', () => {
  it('keeps the error of a failed toggle', async () => {
    const error = new Error('plugin load failed')
    jobs.load.run.mockRejectedValue(error)
    const state = mountState(createPlugin({ loaded: false }))

    await state.toggleLoaded()

    expect(state.error).toBe(error)
  })

  it('is cleared by a successful toggle', async () => {
    jobs.autoload.run.mockRejectedValueOnce(new Error('request failed'))
    const state = mountState(createPlugin())

    await state.toggleAutoload()
    await state.toggleAutoload()

    expect(state.error).toBeUndefined()
  })
})
