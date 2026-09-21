import type { FrontXoPbd, useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import StorageRepositoryPbdDetails from '@/modules/storage-repository/components/general/StorageRepositoryPbdDetails.vue'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createSr } from '@/test/create-sr.ts'
import { findStateHeroText, isStateHeroBusy } from '@/test/find-state-hero.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

// Read only when the component mounts, so the module-scope refs are already initialized
const pbdsBySr = ref(new Map<FrontXoSr['id'], FrontXoPbd[]>())
const arePbdsReady = ref(true)

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({ pbdsBySr, arePbdsReady })) as unknown as typeof useXoPbdCollection,
}))

const sr = createSr()

beforeEach(() => {
  pbdsBySr.value = new Map()
  arePbdsReady.value = true
})

function mountPbdDetails() {
  return mount(StorageRepositoryPbdDetails, { props: { sr }, global: createGlobalTestConfig() })
}

function findDeviceConfigs(wrapper: ReturnType<typeof mountPbdDetails>) {
  return wrapper.findAll('.ui-log-entry-viewer').map(viewer => JSON.parse(viewer.get('code').text()))
}

it('shows the device config of every PBD of the SR', () => {
  pbdsBySr.value = new Map([
    [
      sr.id,
      [
        createPbd({ id: 'pbd-1' as FrontXoPbd['id'], device_config: { location: '/dev/sdb' } }),
        createPbd({ id: 'pbd-2' as FrontXoPbd['id'], device_config: { server: '10.0.0.1', serverpath: '/export' } }),
      ],
    ],
  ])

  const wrapper = mountPbdDetails()

  expect(findDeviceConfigs(wrapper)).toEqual([{ location: '/dev/sdb' }, { server: '10.0.0.1', serverpath: '/export' }])
})

it('labels every device config as such', () => {
  pbdsBySr.value = new Map([[sr.id, [createPbd()]]])

  const wrapper = mountPbdDetails()

  expect(wrapper.get('.ui-log-entry-viewer .label').text()).toBe(t('device-config'))
})

it('says no PBD is attached when the SR has none', () => {
  const wrapper = mountPbdDetails()

  expect(findStateHeroText(wrapper)).toBe(t('no-pbd-attached'))
  expect(findDeviceConfigs(wrapper)).toEqual([])
})

it('leaves out the PBDs of another SR', () => {
  pbdsBySr.value = new Map([['sr-other' as FrontXoSr['id'], [createPbd()]]])

  const wrapper = mountPbdDetails()

  expect(findDeviceConfigs(wrapper)).toEqual([])
})

it('waits for the PBDs rather than saying the SR has none', () => {
  arePbdsReady.value = false

  const wrapper = mountPbdDetails()

  expect(isStateHeroBusy(wrapper)).toBe(true)
  expect(findStateHeroText(wrapper)).not.toBe(t('no-pbd-attached'))
})
