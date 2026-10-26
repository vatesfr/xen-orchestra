import PluginStateToggles from '@/modules/plugin/components/PluginStateToggles.vue'
import type { useXoPluginAutoloadJob } from '@/modules/plugin/jobs/xo-plugin-autoload.job.ts'
import type { useXoPluginLoadJob } from '@/modules/plugin/jobs/xo-plugin-load.job.ts'
import type { useXoPluginUnloadJob } from '@/modules/plugin/jobs/xo-plugin-unload.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { flushPromises, mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useLoadJob, useUnloadJob, useAutoloadJob, load, unload, updateAutoload } = vi.hoisted(() => ({
  useLoadJob: vi.fn(),
  useUnloadJob: vi.fn(),
  useAutoloadJob: vi.fn(),
  load: vi.fn(),
  unload: vi.fn(),
  updateAutoload: vi.fn(),
}))

// The jobs load, unload and patch the plugin through the REST API
vi.mock(import('@/modules/plugin/jobs/xo-plugin-load.job.ts'), () => ({
  useXoPluginLoadJob: useLoadJob as unknown as typeof useXoPluginLoadJob,
}))

vi.mock(import('@/modules/plugin/jobs/xo-plugin-unload.job.ts'), () => ({
  useXoPluginUnloadJob: useUnloadJob as unknown as typeof useXoPluginUnloadJob,
}))

vi.mock(import('@/modules/plugin/jobs/xo-plugin-autoload.job.ts'), () => ({
  useXoPluginAutoloadJob: useAutoloadJob as unknown as typeof useXoPluginAutoloadJob,
}))

beforeEach(() => {
  useLoadJob.mockReset()
  useUnloadJob.mockReset()
  useAutoloadJob.mockReset()
  load.mockReset()
  unload.mockReset()
  updateAutoload.mockReset()

  load.mockResolvedValue(undefined)
  unload.mockResolvedValue(undefined)
  updateAutoload.mockResolvedValue(undefined)
  mockJob(useLoadJob, load)
  mockJob(useUnloadJob, unload)
  mockJob(useAutoloadJob, updateAutoload)
})

function mockJob(
  useJob: typeof useLoadJob,
  run: typeof load,
  { canRun = true, isRunning = false }: { canRun?: boolean; isRunning?: boolean } = {}
) {
  useJob.mockReturnValue({
    run,
    canRun: ref(canRun),
    isRunning: ref(isRunning),
    errorMessage: ref(canRun ? undefined : 'Plugin action in progress…'),
  })
}

function mountToggles(plugin: FrontXoPlugin = createPlugin()) {
  return mount(PluginStateToggles, { props: { plugin }, global: createGlobalTestConfig() })
}

function findToggles(wrapper: ReturnType<typeof mountToggles>) {
  return Object.fromEntries(
    wrapper.findAll('.ui-toggle').map(toggle => {
      const input = toggle.get<HTMLInputElement>('input')

      return [toggle.text(), { checked: input.element.checked, disabled: input.element.disabled }]
    })
  )
}

async function changeToggle(wrapper: ReturnType<typeof mountToggles>, label: string, checked: boolean) {
  const toggle = wrapper.findAll('.ui-toggle').find(toggle => toggle.text() === label)

  if (toggle === undefined) {
    throw new Error(`no "${label}" toggle`)
  }

  await toggle.get('input').setValue(checked)
}

it('reflects whether the plugin is loaded and loaded at startup', () => {
  const wrapper = mountToggles(createPlugin({ loaded: true, autoload: false }))

  expect(findToggles(wrapper)).toEqual({
    [t('loaded')]: { checked: true, disabled: false },
    [t('load-at-startup')]: { checked: false, disabled: false },
  })
})

it('disables the loaded toggle when the plugin cannot be unloaded', () => {
  mockJob(useUnloadJob, unload, { canRun: false })
  const wrapper = mountToggles(createPlugin({ loaded: true }))

  expect(findToggles(wrapper)).toEqual({
    [t('loaded')]: { checked: true, disabled: true },
    [t('load-at-startup')]: { checked: true, disabled: false },
  })
})

it('unloads a loaded plugin when the loaded toggle is turned off', async () => {
  const wrapper = mountToggles(createPlugin({ loaded: true }))

  await changeToggle(wrapper, t('loaded'), false)

  expect(unload).toHaveBeenCalledOnce()
  expect(load).not.toHaveBeenCalled()
})

it('loads an unloaded plugin when the loaded toggle is turned on', async () => {
  const wrapper = mountToggles(createPlugin({ loaded: false }))

  await changeToggle(wrapper, t('loaded'), true)

  expect(load).toHaveBeenCalledOnce()
  expect(unload).not.toHaveBeenCalled()
})

it('turns off the autoload when the autoload toggle is turned off', async () => {
  const wrapper = mountToggles(createPlugin({ autoload: true }))

  await changeToggle(wrapper, t('load-at-startup'), false)

  expect(updateAutoload).toHaveBeenCalledOnce()
  expect(toValue(useAutoloadJob.mock.lastCall?.[1])).toBe(false)
})

it('disables both toggles while the plugin is being loaded or unloaded', () => {
  mockJob(useUnloadJob, unload, { isRunning: true })
  const wrapper = mountToggles(createPlugin({ loaded: true }))

  expect(Object.values(findToggles(wrapper)).map(toggle => toggle.disabled)).toEqual([true, true])
})

it('disables both toggles while the autoload is being updated', () => {
  mockJob(useAutoloadJob, updateAutoload, { isRunning: true })
  const wrapper = mountToggles(createPlugin({ loaded: true }))

  expect(Object.values(findToggles(wrapper)).map(toggle => toggle.disabled)).toEqual([true, true])
})

it('displays the error of the last action', async () => {
  updateAutoload.mockRejectedValue(new Error('plugin not configured'))
  const wrapper = mountToggles(createPlugin({ autoload: true }))

  await changeToggle(wrapper, t('load-at-startup'), false)
  await flushPromises()

  const alert = wrapper.get('.api-error-alert')

  expect(alert.text()).toContain(t('plugin:action-failed'))
  expect(alert.text()).toContain('plugin not configured')
})

it('displays no error before any action failed', () => {
  const wrapper = mountToggles()

  expect(wrapper.find('.api-error-alert').exists()).toBe(false)
})
