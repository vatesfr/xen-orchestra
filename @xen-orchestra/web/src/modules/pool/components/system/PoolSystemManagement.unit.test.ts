import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import PoolSystemManagement from '@/modules/pool/components/system/PoolSystemManagement.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool } from '@/test/create-pool.ts'
import { findLabelledLinks, findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

const { useXoHostCollectionMock, useGetHostById, isMasterHost } = vi.hoisted(() => ({
  useXoHostCollectionMock: vi.fn(),
  useGetHostById: vi.fn(),
  isMasterHost: vi.fn(),
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: useXoHostCollectionMock as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  useXoHostCollectionMock.mockReset()
  useGetHostById.mockReset()
  isMasterHost.mockReset()

  useXoHostCollectionMock.mockReturnValue({ useGetHostById, isMasterHost, areHostsReady: ref(true) })
  useGetHostById.mockReturnValue(computed(() => undefined))
  isMasterHost.mockReturnValue(false)
})

function mountManagement(pool: FrontXoPool = createPool()) {
  return mount(PoolSystemManagement, {
    props: { pool },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountManagement()

  expect(wrapper.get('.ui-title').text()).toBe(t('pool-management'))
})

it('shows a busy state instead of the rows while the hosts are loading', () => {
  useXoHostCollectionMock.mockReturnValue({ useGetHostById, isMasterHost, areHostsReady: ref(false) })

  const wrapper = mountManagement()

  expect(wrapper.find('.vts-state-hero').exists()).toBe(true)
  expect(findLabelledValues(wrapper)).toEqual({})
})

it('links the master row to the dashboard of the primary host', () => {
  useGetHostById.mockReturnValue(
    computed(() => createHost({ id: 'host-1' as FrontXoHost['id'], name_label: 'Primary' }))
  )

  const wrapper = mountManagement(createPool({ master: 'host-1' as FrontXoPool['master'] }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('master')]: 'Primary' })
  expect(findLabelledLinks(wrapper)).toEqual({ [t('master')]: '/host/host-1/dashboard' })
})

it('falls back to "None" when the primary host of the pool is unknown', () => {
  const wrapper = mountManagement()

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('master')]: t('none') })
  expect(findLabelledLinks(wrapper)).toEqual({})
})

it('shows every pool setting the pool has turned on as enabled', () => {
  const pool = createPool({
    auto_poweron: true,
    HA_enabled: true,
    haRebootVmOnInternalShutdown: true,
    migrationCompression: true,
  })

  expect(findLabelledValues(mountManagement(pool))).toMatchObject({
    [t('auto-power')]: t('enabled'),
    [t('high-availability')]: t('enabled'),
    [t('reboot-vm-internal-shutdown')]: t('enabled'),
    [t('migration-compression')]: t('enabled'),
  })
})

it('shows every pool setting the pool has turned off as disabled', () => {
  const pool = createPool({
    auto_poweron: false,
    HA_enabled: false,
    haRebootVmOnInternalShutdown: false,
    migrationCompression: false,
  })

  expect(findLabelledValues(mountManagement(pool))).toMatchObject({
    [t('auto-power')]: t('disabled'),
    [t('high-availability')]: t('disabled'),
    [t('reboot-vm-internal-shutdown')]: t('disabled'),
    [t('migration-compression')]: t('disabled'),
  })
})

it('shows migration compression as disabled when the pool does not report it', () => {
  const wrapper = mountManagement(createPool({ migrationCompression: undefined }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('migration-compression')]: t('disabled') })
})
