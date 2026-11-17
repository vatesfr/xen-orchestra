import PluginConfigurationDrawer from '@/modules/plugin/components/drawer/PluginConfigurationDrawer.vue'
import PluginTestDrawer from '@/modules/plugin/components/drawer/PluginTestDrawer.vue'
import { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import type { useXoPluginConfigurationDelete } from '@/modules/plugin/composables/use-xo-plugin-configuration-delete.composable.ts'
import type { useXoPluginDrawerJob } from '@/modules/plugin/composables/use-xo-plugin-drawer-job.composable.ts'
import type { useXoPluginAutoloadJob } from '@/modules/plugin/jobs/xo-plugin-autoload.job.ts'
import type { useXoPluginChangeStateJob } from '@/modules/plugin/jobs/xo-plugin-change-state.job.ts'
import { useXoPluginConfigureJob } from '@/modules/plugin/jobs/xo-plugin-configure.job.ts'
import { useXoPluginTestJob } from '@/modules/plugin/jobs/xo-plugin-test.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { toValue } from 'vue'

const {
  useChangeStateJob,
  useAutoloadJob,
  useDrawerJob,
  useDelete,
  changeState,
  updateAutoload,
  configurePlugin,
  testPlugin,
  deleteConfiguration,
} = vi.hoisted(() => ({
  useChangeStateJob: vi.fn(),
  useAutoloadJob: vi.fn(),
  useDrawerJob: vi.fn(),
  useDelete: vi.fn(),
  changeState: vi.fn(),
  updateAutoload: vi.fn(),
  configurePlugin: vi.fn(),
  testPlugin: vi.fn(),
  deleteConfiguration: vi.fn(),
}))

vi.mock(import('@/modules/plugin/jobs/xo-plugin-change-state.job.ts'), () => ({
  useXoPluginChangeStateJob: useChangeStateJob as unknown as typeof useXoPluginChangeStateJob,
}))

vi.mock(import('@/modules/plugin/jobs/xo-plugin-autoload.job.ts'), () => ({
  useXoPluginAutoloadJob: useAutoloadJob as unknown as typeof useXoPluginAutoloadJob,
}))

// The composables open overlays and run jobs, which call the REST API
vi.mock(import('@/modules/plugin/composables/use-xo-plugin-drawer-job.composable.ts'), () => ({
  useXoPluginDrawerJob: useDrawerJob as unknown as typeof useXoPluginDrawerJob,
}))

vi.mock(import('@/modules/plugin/composables/use-xo-plugin-configuration-delete.composable.ts'), () => ({
  useXoPluginConfigurationDelete: useDelete as unknown as typeof useXoPluginConfigurationDelete,
}))

// Both drawer actions use the same composable, told apart by the job they run
const drawerJobs = new Map<unknown, unknown>()

beforeEach(() => {
  useChangeStateJob.mockReset()
  useAutoloadJob.mockReset()
  useDrawerJob.mockReset()
  useDelete.mockReset()
  changeState.mockReset()
  updateAutoload.mockReset()
  configurePlugin.mockReset()
  testPlugin.mockReset()
  deleteConfiguration.mockReset()

  useChangeStateJob.mockReturnValue(createJobResult(changeState))
  useAutoloadJob.mockReturnValue(createJobResult(updateAutoload))
  useDrawerJob.mockImplementation((_plugin, { useJob }) => drawerJobs.get(useJob))
  mockDrawerJob(useXoPluginConfigureJob, configurePlugin)
  mockDrawerJob(useXoPluginTestJob, testPlugin)
  mockDelete()
})

function mockDrawerJob(useJob: unknown, openDrawer: () => void, state: Parameters<typeof createJobResult>[1] = {}) {
  const { run, ...jobState } = createJobResult(openDrawer, state)

  drawerJobs.set(useJob, { openDrawer: run, ...jobState })
}

function mockDelete(state: Parameters<typeof createJobResult>[1] = {}) {
  const { run, canRun, isRunning, errorMessage } = createJobResult(deleteConfiguration, state)

  useDelete.mockReturnValue({
    deleteConfiguration: run,
    canDeleteConfiguration: canRun,
    isDeletingConfiguration: isRunning,
    deleteConfigurationErrorMessage: errorMessage,
  })
}

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

  it('is disabled while the plugin is being tested', () => {
    mockDrawerJob(useXoPluginTestJob, testPlugin, { canRun: false, isRunning: true })

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

describe('drawers', () => {
  it.each([
    { useJob: useXoPluginConfigureJob, drawer: PluginConfigurationDrawer, name: 'configuration' },
    { useJob: useXoPluginTestJob, drawer: PluginTestDrawer, name: 'test' },
  ])('runs the $name job from its drawer', async ({ useJob, drawer }) => {
    mountActions()

    const [, options] = useDrawerJob.mock.calls.find(([, options]) => options.useJob === useJob) ?? []

    expect((await options.drawer()).default).toBe(drawer)
  })
})

describe('configureAction', () => {
  it('opens the configuration drawer on click', () => {
    const { configureAction } = mountActions()

    configureAction.onClick()

    expect(configureAction).toMatchObject({ label: t('action:configure'), icon: 'action:edit' })
    expect(configurePlugin).toHaveBeenCalledOnce()
  })

  it('can run when the plugin can be configured', () => {
    expect(mountActions().configureAction).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the plugin cannot be configured', () => {
    mockDrawerJob(useXoPluginConfigureJob, configurePlugin, { canRun: false, errorMessage: 'not configurable' })

    expect(mountActions().configureAction).toMatchObject({ disabled: true, hint: 'not configurable' })
  })

  it('is busy while the configuration is being saved', () => {
    mockDrawerJob(useXoPluginConfigureJob, configurePlugin, { canRun: false, isRunning: true })

    expect(mountActions().configureAction.busy).toBe(true)
  })

  it('is disabled while the configuration is being deleted', () => {
    mockDelete({ canRun: false, isRunning: true })

    expect(mountActions().configureAction.disabled).toBe(true)
  })
})

describe('testAction', () => {
  it('opens the test drawer on click', () => {
    const { testAction } = mountActions()

    testAction.onClick()

    expect(testAction).toMatchObject({ label: t('action:test-plugin'), icon: 'action:scan' })
    expect(testPlugin).toHaveBeenCalledOnce()
  })

  it('can run when the plugin can be tested', () => {
    expect(mountActions().testAction).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the plugin cannot be tested', () => {
    mockDrawerJob(useXoPluginTestJob, testPlugin, { canRun: false, errorMessage: 'not loaded' })

    expect(mountActions().testAction).toMatchObject({ disabled: true, hint: 'not loaded' })
  })

  it('is busy while the plugin is being tested', () => {
    mockDrawerJob(useXoPluginTestJob, testPlugin, { canRun: false, isRunning: true })

    expect(mountActions().testAction.busy).toBe(true)
  })

  it('is disabled while the plugin is being loaded or unloaded', () => {
    useChangeStateJob.mockReturnValue(createJobResult(changeState, { canRun: false, isRunning: true }))

    expect(mountActions().testAction).toMatchObject({ disabled: true, hint: undefined })
  })
})

describe('deleteConfigurationAction', () => {
  it('asks to delete the configuration on click, apart from the other actions', () => {
    const { deleteConfigurationAction } = mountActions()

    deleteConfigurationAction.onClick()

    expect(deleteConfigurationAction).toMatchObject({
      label: t('action:delete-configuration'),
      icon: 'action:delete',
      accent: 'danger',
      separator: true,
    })
    expect(deleteConfiguration).toHaveBeenCalledOnce()
  })

  it('can run when the configuration can be deleted', () => {
    expect(mountActions().deleteConfigurationAction).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the configuration cannot be deleted', () => {
    mockDelete({ canRun: false, errorMessage: 'plugin loaded' })

    expect(mountActions().deleteConfigurationAction).toMatchObject({ disabled: true, hint: 'plugin loaded' })
  })

  it('is busy while the configuration is being deleted', () => {
    mockDelete({ canRun: false, isRunning: true })

    expect(mountActions().deleteConfigurationAction.busy).toBe(true)
  })

  it('is disabled while the configuration is being saved', () => {
    mockDrawerJob(useXoPluginConfigureJob, configurePlugin, { canRun: false, isRunning: true })

    expect(mountActions().deleteConfigurationAction.disabled).toBe(true)
  })
})

describe('moreActions', () => {
  it('lists the secondary actions, the deletion last', () => {
    const { moreActions, autoloadAction, testAction, deleteConfigurationAction } = mountActions()

    expect(moreActions).toEqual([autoloadAction, testAction, deleteConfigurationAction])
  })
})
