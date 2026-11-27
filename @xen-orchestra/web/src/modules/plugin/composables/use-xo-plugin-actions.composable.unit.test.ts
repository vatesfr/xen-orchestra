import PluginConfigurationDrawer from '@/modules/plugin/components/drawer/PluginConfigurationDrawer.vue'
import PluginTestDrawer from '@/modules/plugin/components/drawer/PluginTestDrawer.vue'
import { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import { useXoPluginConfigurationDelete } from '@/modules/plugin/composables/use-xo-plugin-configuration-delete.composable.ts'
import { useXoPluginDrawerJob } from '@/modules/plugin/composables/use-xo-plugin-drawer-job.composable.ts'
import { useXoPluginAutoloadJob } from '@/modules/plugin/jobs/xo-plugin-autoload.job.ts'
import { useXoPluginChangeStateJob } from '@/modules/plugin/jobs/xo-plugin-change-state.job.ts'
import { useXoPluginConfigureJob } from '@/modules/plugin/jobs/xo-plugin-configure.job.ts'
import { useXoPluginTestJob } from '@/modules/plugin/jobs/xo-plugin-test.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { itRunsJobFromAction } from '@/test/action-item-job.ts'
import { createJobResult, type JobResultState, toJobComposableResult } from '@/test/create-job-result.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import { toValue } from 'vue'

// The composables open overlays and run jobs, which call the REST API
const useChangeStateJob = mockedExport(useXoPluginChangeStateJob)
const useAutoloadJob = mockedExport(useXoPluginAutoloadJob)
const useDrawerJob = mockedExport(useXoPluginDrawerJob)
const useDelete = mockedExport(useXoPluginConfigurationDelete)

const changeState = vi.fn()
const updateAutoload = vi.fn()
const configurePlugin = vi.fn()
const testPlugin = vi.fn()
const deleteConfiguration = vi.fn()

// Both drawer actions use the same composable, told apart by the job they run
const drawerJobs = new Map<unknown, unknown>()

beforeEach(() => {
  changeState.mockReset()
  updateAutoload.mockReset()
  configurePlugin.mockReset()
  testPlugin.mockReset()
  deleteConfiguration.mockReset()

  mockChangeStateJob()
  mockAutoloadJob()
  useDrawerJob.mockImplementation((_plugin, { useJob }) => drawerJobs.get(useJob))
  mockDrawerJob(useXoPluginConfigureJob, configurePlugin)
  mockDrawerJob(useXoPluginTestJob, testPlugin)
  mockDelete()
})

const RUNNING: JobResultState = { canRun: false, isRunning: true }

function mockChangeStateJob(state: JobResultState = {}) {
  useChangeStateJob.mockReturnValue(createJobResult(changeState, state))
}

function mockAutoloadJob(state: JobResultState = {}) {
  useAutoloadJob.mockReturnValue(createJobResult(updateAutoload, state))
}

function mockDrawerJob(useJob: unknown, openDrawer: () => void, state: Parameters<typeof createJobResult>[1] = {}) {
  const { run, ...jobState } = createJobResult(openDrawer, state)

  drawerJobs.set(useJob, { openDrawer: run, ...jobState })
}

function mockDelete(state: Parameters<typeof createJobResult>[1] = {}) {
  useDelete.mockReturnValue(
    toJobComposableResult(createJobResult(deleteConfiguration, state), 'deleteConfiguration', 'isDeletingConfiguration')
  )
}

function mountActions(plugin: FrontXoPlugin = createPlugin()) {
  return mountComposable(() => useXoPluginActions(plugin)).wrapper.vm
}

// The jobs receive the targeted state as a getter
function findTargetedState(useJob: typeof useChangeStateJob) {
  const [, state] = useJob.mock.lastCall ?? []

  return toValue(state)
}

type StateActionCase = [
  action: 'loadAction' | 'autoloadAction',
  {
    field: 'loaded' | 'autoload'
    target: string
    targets: { value: boolean | undefined; label: string; icon: string; targetedState: boolean }[]
    useJob: typeof useChangeStateJob
    run: typeof changeState
    setJobState: (state: JobResultState) => void
    errorMessage: string
    disabledWhile: Record<string, () => void>
  },
]

const STATE_ACTIONS: StateActionCase[] = [
  [
    'loadAction',
    {
      field: 'loaded',
      target: 'state',
      targets: [
        { value: true, label: 'action:unload', icon: 'action:disconnect', targetedState: false },
        { value: false, label: 'action:load', icon: 'action:connect', targetedState: true },
        { value: undefined, label: 'action:load', icon: 'action:connect', targetedState: true },
      ],
      useJob: useChangeStateJob,
      run: changeState,
      setJobState: mockChangeStateJob,
      errorMessage: 'not configured',
      disabledWhile: {
        'the autoload is being updated': () => mockAutoloadJob(RUNNING),
        'the plugin is being tested': () => mockDrawerJob(useXoPluginTestJob, testPlugin, RUNNING),
      },
    },
  ],
  [
    'autoloadAction',
    {
      field: 'autoload',
      target: 'autoload',
      targets: [
        { value: true, label: 'action:disable-load-at-startup', icon: 'action:change-state', targetedState: false },
        { value: false, label: 'action:enable-load-at-startup', icon: 'action:change-state', targetedState: true },
      ],
      useJob: useAutoloadJob,
      run: updateAutoload,
      setJobState: mockAutoloadJob,
      errorMessage: 'missing plugin',
      disabledWhile: { 'the plugin is being loaded or unloaded': () => mockChangeStateJob(RUNNING) },
    },
  ],
]

describe.each(STATE_ACTIONS)(
  '%s',
  (action, { field, target, targets, useJob, run, setJobState, errorMessage, disabledWhile }) => {
    it.each(targets)(
      `targets the opposite ${target} of a plugin with $value as ${field}`,
      ({ value, label, icon, targetedState }) => {
        const actionItem = mountActions(createPlugin({ [field]: value }))[action]

        expect({ label: actionItem.label, icon: actionItem.icon }).toEqual({ label: t(label), icon })
        expect(findTargetedState(useJob)).toBe(targetedState)
      }
    )

    itRunsJobFromAction({
      getAction: () => mountActions()[action],
      setJobState,
      errorMessage,
      click: { run },
      disabledWhile,
    })
  }
)

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

type DrawerActionCase = [
  action: 'configureAction' | 'testAction',
  {
    useJob: unknown
    openDrawer: typeof configurePlugin
    drawer: string
    item: Partial<LeafActionItem>
    errorMessage: string
    disabledWhile: Record<string, () => void>
  },
]

const DRAWER_ACTIONS: DrawerActionCase[] = [
  [
    'configureAction',
    {
      useJob: useXoPluginConfigureJob,
      openDrawer: configurePlugin,
      drawer: 'configuration',
      item: { label: t('action:configure'), icon: 'action:edit' },
      errorMessage: 'not configurable',
      disabledWhile: { 'the configuration is being deleted': () => mockDelete(RUNNING) },
    },
  ],
  [
    'testAction',
    {
      useJob: useXoPluginTestJob,
      openDrawer: testPlugin,
      drawer: 'test',
      item: { label: t('action:test-plugin'), icon: 'action:scan' },
      errorMessage: 'not loaded',
      disabledWhile: { 'the plugin is being loaded or unloaded': () => mockChangeStateJob(RUNNING) },
    },
  ],
]

describe.each(DRAWER_ACTIONS)('%s', (action, { useJob, openDrawer, drawer, item, errorMessage, disabledWhile }) => {
  itRunsJobFromAction({
    getAction: () => mountActions()[action],
    setJobState: state => mockDrawerJob(useJob, openDrawer, state),
    errorMessage,
    click: { run: openDrawer, name: `opens the ${drawer} drawer on click`, item },
    disabledWhile,
  })
})

describe('deleteConfigurationAction', () => {
  itRunsJobFromAction({
    getAction: () => mountActions().deleteConfigurationAction,
    setJobState: mockDelete,
    errorMessage: 'plugin loaded',
    click: {
      run: deleteConfiguration,
      name: 'asks to delete the configuration on click, apart from the other actions',
      item: { label: t('action:delete-configuration'), icon: 'action:delete', accent: 'danger', separator: true },
    },
    disabledWhile: {
      'the configuration is being saved': () => mockDrawerJob(useXoPluginConfigureJob, configurePlugin, RUNNING),
    },
  })
})

describe('moreActions', () => {
  it('lists the secondary actions, the deletion last', () => {
    const { moreActions, autoloadAction, testAction, deleteConfigurationAction } = mountActions()

    expect(moreActions).toEqual([autoloadAction, testAction, deleteConfigurationAction])
  })
})
