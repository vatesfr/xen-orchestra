import type {
  FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import PoolSystemNetworking from '@/modules/pool/components/system/PoolSystemNetworking.vue'
import { createNetwork } from '@/test/create-network.ts'
import { createPool } from '@/test/create-pool.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { useXoNetworkCollectionMock, getNetworkById } = vi.hoisted(() => ({
  useXoNetworkCollectionMock: vi.fn(),
  getNetworkById: vi.fn(),
}))

vi.mock(import('@/modules/network/remote-resources/use-xo-network-collection.ts'), () => ({
  useXoNetworkCollection: useXoNetworkCollectionMock as unknown as typeof useXoNetworkCollection,
}))

beforeEach(() => {
  useXoNetworkCollectionMock.mockReset()
  getNetworkById.mockReset()

  useXoNetworkCollectionMock.mockReturnValue({ getNetworkById, areNetworksReady: ref(true) })
  getNetworkById.mockReturnValue(undefined)
})

function mountNetworking(backupNetworkId?: string) {
  const otherConfig: Record<string, string> =
    backupNetworkId === undefined ? {} : { 'xo:backupNetwork': backupNetworkId }

  return mount(PoolSystemNetworking, {
    props: { pool: createPool({ otherConfig }) },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountNetworking()

  expect(wrapper.get('.ui-title').text()).toBe(t('networking'))
})

it('shows a busy state instead of the rows while the networks are loading', () => {
  useXoNetworkCollectionMock.mockReturnValue({ getNetworkById, areNetworksReady: ref(false) })

  const wrapper = mountNetworking()

  expect(wrapper.find('.vts-state-hero').exists()).toBe(true)
  expect(wrapper.findAll('.vts-tabular-key-value-row')).toHaveLength(0)
})

it('links the backup network row to the networks page of the pool owning that network', () => {
  getNetworkById.mockReturnValue(
    createNetwork({
      id: 'network-1' as FrontXoNetwork['id'],
      name_label: 'Backup Network',
      $pool: 'pool-1' as FrontXoNetwork['$pool'],
    })
  )

  const wrapper = mountNetworking('network-1')

  expect(findLabelledValues(wrapper)).toEqual({ [t('backup-network')]: 'Backup Network' })
  expect(wrapper.get('.vts-tabular-key-value-row a').attributes('href')).toBe('/pool/pool-1/networks?id=network-1')
})

it('looks the backup network up by the id the pool configured', () => {
  mountNetworking('network-1')

  expect(getNetworkById).toHaveBeenCalledWith('network-1')
})

it('falls back to "None" when the pool configures no backup network', () => {
  const wrapper = mountNetworking()

  expect(findLabelledValues(wrapper)).toEqual({ [t('backup-network')]: t('none') })
  expect(getNetworkById).not.toHaveBeenCalled()
})

it('falls back to "None" when the configured backup network no longer exists', () => {
  const wrapper = mountNetworking('network-gone')

  expect(findLabelledValues(wrapper)).toEqual({ [t('backup-network')]: t('none') })
})
