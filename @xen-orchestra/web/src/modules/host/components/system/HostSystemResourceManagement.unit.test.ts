import HostSystemResourceManagement from '@/modules/host/components/system/HostSystemResourceManagement.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoVmControllerCollection } from '@/modules/vm/remote-resources/use-xo-vm-controller-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createVmController } from '@/test/create-vm-controller.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

const { getVmControllerById } = vi.hoisted(() => ({
  getVmControllerById: vi.fn(),
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-controller-collection.ts'), () => ({
  useXoVmControllerCollection: (() => ({ getVmControllerById })) as unknown as typeof useXoVmControllerCollection,
}))

beforeEach(() => {
  getVmControllerById.mockReset()
  getVmControllerById.mockReturnValue(undefined)
})

function mountResourceManagement(host: FrontXoHost = createHost()) {
  return mount(HostSystemResourceManagement, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountResourceManagement()

  expect(wrapper.get('.ui-title').text()).toBe(t('resource-management'))
})

it('shows the memory of the control domain of the host', () => {
  getVmControllerById.mockReturnValue(createVmController())

  const wrapper = mountResourceManagement(
    createHost({ controlDomain: 'vm-controller-1' as FrontXoHost['controlDomain'] })
  )

  expect(findLabelledValues(wrapper)).toEqual({ [t('control-domain-memory')]: '2 GiB' })
})

it('rounds the memory of the control domain to two decimals', () => {
  getVmControllerById.mockReturnValue(
    createVmController({ memory: { dynamic: [0, 0], size: 1610612736, static: [0, 0] } })
  )

  const wrapper = mountResourceManagement(
    createHost({ controlDomain: 'vm-controller-1' as FrontXoHost['controlDomain'] })
  )

  expect(findLabelledValues(wrapper)).toEqual({ [t('control-domain-memory')]: '1.5 GiB' })
})

it('leaves the memory empty when the host reports no control domain', () => {
  const wrapper = mountResourceManagement(createHost({ controlDomain: undefined }))

  expect(findLabelledValues(wrapper)).toEqual({ [t('control-domain-memory')]: '' })
})

it('leaves the memory empty while the control domain of the host is still unknown', () => {
  const wrapper = mountResourceManagement(
    createHost({ controlDomain: 'vm-controller-1' as FrontXoHost['controlDomain'] })
  )

  expect(findLabelledValues(wrapper)).toEqual({ [t('control-domain-memory')]: '' })
})
