import { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import type { useXoPluginAutoloadJob } from '@/modules/plugin/jobs/xo-plugin-autoload.job.ts'
import type { useXoPluginChangeStateJob } from '@/modules/plugin/jobs/xo-plugin-change-state.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { toValue } from 'vue'

const { useChangeStateJob, useAutoloadJob, changeState, updateAutoload } = vi.hoisted(() => ({
  useChangeStateJob: vi.fn(),
  useAutoloadJob: vi.fn(),
  changeState: vi.fn(),
  updateAutoload: vi.fn(),
}))

vi.mock(import('@/modules/plugin/jobs/xo-plugin-change-state.job.ts'), () => ({
  useXoPluginChangeStateJob: useChangeStateJob as unknown as typeof useXoPluginChangeStateJob,
}))

vi.mock(import('@/modules/plugin/jobs/xo-plugin-autoload.job.ts'), () => ({
  useXoPluginAutoloadJob: useAutoloadJob as unknown as typeof useXoPluginAutoloadJob,
}))

beforeEach(() => {
  useChangeStateJob.mockReset()
  useAutoloadJob.mockReset()
  changeState.mockReset()
  updateAutoload.mockReset()

  useChangeStateJob.mockReturnValue(createJobResult(changeState))
  useAutoloadJob.mockReturnValue(createJobResult(updateAutoload))
})

function mountActions(plugin: FrontXoPlugin = createPlugin()) {
  return mountComposable(() => useXoPluginActions(plugin)).wrapper.vm
}

// The jobs receive the targeted state as a getter
function findTargetedState(useJob: typeof useChangeStateJob) {
  const [, state] = useJob.mock.lastCall ?? []

  return toValue(state)
}

describe('loadAction', () => {
  it.each([
    { loaded: true, label: 'action:unload', icon: 'action:disconnect', targetedState: false },
    { loaded: false, label: 'action:load', icon: 'action:connect', targetedState: true },
    { loaded: undefined, label: 'action:load', icon: 'action:connect', targetedState: true },
  ] as const)(
    'targets the opposite state of a plugin with $loaded as loaded',
    ({ loaded, label, icon, targetedState }) => {
      const { loadAction } = mountActions(createPlugin({ loaded }))

      expect({ label: loadAction.label, icon: loadAction.icon }).toEqual({ label: t(label), icon })
      expect(findTargetedState(useChangeStateJob)).toBe(targetedState)
    }
  )

  it('runs the job on click', () => {
    mountActions().loadAction.onClick()

    expect(changeState).toHaveBeenCalledOnce()
  })

  it('can run when the job can run', () => {
    expect(mountActions().loadAction).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the job cannot run', () => {
    useChangeStateJob.mockReturnValue(createJobResult(changeState, { canRun: false, errorMessage: 'not configured' }))

    expect(mountActions().loadAction).toMatchObject({ disabled: true, hint: 'not configured' })
  })

  it('is busy while the job runs', () => {
    useChangeStateJob.mockReturnValue(createJobResult(changeState, { canRun: false, isRunning: true }))

    expect(mountActions().loadAction.busy).toBe(true)
  })

  it('is disabled while the autoload is being updated', () => {
    useAutoloadJob.mockReturnValue(createJobResult(updateAutoload, { canRun: false, isRunning: true }))

    expect(mountActions().loadAction).toMatchObject({ disabled: true, hint: undefined })
  })
})

describe('autoloadAction', () => {
  it.each([
    { autoload: true, label: 'action:disable-load-at-startup', targetedState: false },
    { autoload: false, label: 'action:enable-load-at-startup', targetedState: true },
  ] as const)(
    'targets the opposite autoload of a plugin with $autoload as autoload',
    ({ autoload, label, targetedState }) => {
      const { autoloadAction } = mountActions(createPlugin({ autoload }))

      expect({ label: autoloadAction.label, icon: autoloadAction.icon }).toEqual({
        label: t(label),
        icon: 'action:change-state',
      })
      expect(findTargetedState(useAutoloadJob)).toBe(targetedState)
    }
  )

  it('runs the job on click', () => {
    mountActions().autoloadAction.onClick()

    expect(updateAutoload).toHaveBeenCalledOnce()
  })

  it('can run when the job can run', () => {
    expect(mountActions().autoloadAction).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the job cannot run', () => {
    useAutoloadJob.mockReturnValue(createJobResult(updateAutoload, { canRun: false, errorMessage: 'missing plugin' }))

    expect(mountActions().autoloadAction).toMatchObject({ disabled: true, hint: 'missing plugin' })
  })

  it('is busy while the job runs', () => {
    useAutoloadJob.mockReturnValue(createJobResult(updateAutoload, { canRun: false, isRunning: true }))

    expect(mountActions().autoloadAction.busy).toBe(true)
  })

  it('is disabled while the plugin is being loaded or unloaded', () => {
    useChangeStateJob.mockReturnValue(createJobResult(changeState, { canRun: false, isRunning: true }))

    expect(mountActions().autoloadAction).toMatchObject({ disabled: true, hint: undefined })
  })
})
