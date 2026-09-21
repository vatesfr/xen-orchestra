import HostSystemGeneralInformation from '@/modules/host/components/system/HostSystemGeneralInformation.vue'
import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool } from '@/test/create-pool.ts'
import { findTitleText } from '@/test/find-card-heading.ts'
import { findLabelledLinks, findLabelledValues } from '@/test/find-labelled-values.ts'
import { findTagLabels } from '@/test/find-tags.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { relativeTime, t } from '@/test/i18n.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

const { useGetPoolById, getMasterHostByPoolId, isMasterHost } = vi.hoisted(() => ({
  useGetPoolById: vi.fn(),
  getMasterHostByPoolId: vi.fn(),
  isMasterHost: vi.fn(),
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({ useGetPoolById })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getMasterHostByPoolId, isMasterHost })) as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  useGetPoolById.mockReset()
  getMasterHostByPoolId.mockReset()
  isMasterHost.mockReset()

  useGetPoolById.mockReturnValue(computed(() => undefined))
  getMasterHostByPoolId.mockReturnValue(undefined)
  isMasterHost.mockReturnValue(false)
})

function mountGeneralInformation(host: FrontXoHost = createHost()) {
  return mount(HostSystemGeneralInformation, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountGeneralInformation()

  expect(findTitleText(wrapper)).toBe(t('general-information'))
})

it('shows the name, uuid and description of the host', () => {
  const wrapper = mountGeneralInformation(
    createHost({
      id: 'host-1' as FrontXoHost['id'],
      name_label: 'Primary Host',
      name_description: 'The first host of the pool',
    })
  )

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('name')]: 'Primary Host',
    [t('uuid')]: 'host-1',
    [t('description')]: 'The first host of the pool',
  })
})

it('lists every tag of the host', () => {
  const wrapper = mountGeneralInformation(createHost({ tags: ['production', 'billing'] }))

  expect(findTagLabels(wrapper)).toEqual(['production', 'billing'])
})

it('renders no tag when the host has none', () => {
  const wrapper = mountGeneralInformation(createHost({ tags: [] }))

  expect(findTagLabels(wrapper)).toEqual([])
  expect(findLabelledValues(wrapper)).toMatchObject({ [t('tags')]: '' })
})

it('shows the status as enabled when the host is enabled', () => {
  const wrapper = mountGeneralInformation(createHost({ enabled: true }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('status')]: t('enabled') })
})

it('shows the status as disabled when the host is not enabled', () => {
  const wrapper = mountGeneralInformation(createHost({ enabled: false }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('status')]: t('disabled') })
})

it('links the pool row to the dashboard of the pool of the host', () => {
  useGetPoolById.mockReturnValue(
    computed(() => createPool({ id: 'pool-1' as FrontXoPool['id'], name_label: 'Production' }))
  )

  const wrapper = mountGeneralInformation()

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('pool')]: 'Production' })
  expect(findLabelledLinks(wrapper)).toMatchObject({ [t('pool')]: '/pool/pool-1/dashboard' })
})

it('leaves the pool row empty while the pool of the host is still unknown', () => {
  const wrapper = mountGeneralInformation()

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('pool')]: '' })
  expect(findLabelledLinks(wrapper)).not.toHaveProperty(t('pool'))
})

it('names the host itself as the primary of its pool', () => {
  isMasterHost.mockReturnValue(true)

  const wrapper = mountGeneralInformation()

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('master')]: t('this-host') })
  expect(findLabelledLinks(wrapper)).not.toHaveProperty(t('master'))
})

it('links the master row to the primary of the pool when it is another host', () => {
  getMasterHostByPoolId.mockReturnValue(createHost({ id: 'host-2' as FrontXoHost['id'], name_label: 'Other Host' }))

  const wrapper = mountGeneralInformation()

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('master')]: 'Other Host' })
  expect(findLabelledLinks(wrapper)).toMatchObject({ [t('master')]: '/host/host-2/dashboard' })
})

it('leaves the master row empty while the primary of the pool is still unknown', () => {
  const wrapper = mountGeneralInformation()

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('master')]: '' })
})

it('reports how long ago a running host started, reading its start time as seconds', () => {
  const startTimeInSeconds = 1660000000

  const wrapper = mountGeneralInformation(
    createHost({ power_state: HOST_POWER_STATE.RUNNING, startTime: startTimeInSeconds })
  )

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('started')]: relativeTime(startTimeInSeconds * 1000),
  })
})

it('leaves the start time empty for a halted host', () => {
  const wrapper = mountGeneralInformation(createHost({ power_state: HOST_POWER_STATE.HALTED }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('started')]: '' })
})

it('leaves the start time empty when a running host reports none', () => {
  const wrapper = mountGeneralInformation(createHost({ power_state: HOST_POWER_STATE.RUNNING, startTime: 0 }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('started')]: '' })
})

it('shows the power-on mode as enabled when the host has one configured', () => {
  const wrapper = mountGeneralInformation(createHost({ powerOnMode: 'wake-on-lan' }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('power-on-mode')]: t('enabled') })
})

it('shows the power-on mode as disabled when the host has none configured', () => {
  const wrapper = mountGeneralInformation(createHost({ powerOnMode: '' }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('power-on-mode')]: t('disabled') })
})
