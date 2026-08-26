import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VmSystemManagement from '@/modules/vm/components/system/VmSystemManagement.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createVm } from '@/test/create-vm.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { VM_OPERATIONS } from '@vates/types'
import { mount } from '@vue/test-utils'

const { getHostById } = vi.hoisted(() => ({
  getHostById: vi.fn(),
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById })) as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  getHostById.mockReset()
  getHostById.mockReturnValue(undefined)
})

function mountManagement(vm: FrontXoVm = createVm()) {
  return mount(VmSystemManagement, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountManagement()

  expect(wrapper.get('.ui-title').text()).toBe('VM management')
})

it('shows high availability as enabled when the VM has a restart priority', () => {
  const wrapper = mountManagement(createVm({ high_availability: 'restart' }))

  expect(findLabelledValues(wrapper)).toMatchObject({ 'High availability (HA)': 'Enabled' })
})

it('shows high availability as disabled when the VM has no restart priority', () => {
  const wrapper = mountManagement(createVm({ high_availability: '' }))

  expect(findLabelledValues(wrapper)).toMatchObject({ 'High availability (HA)': 'Disabled' })
})

it('shows the name of the affinity host', () => {
  getHostById.mockReturnValue(createHost({ name_label: 'Primary Host' }))

  const wrapper = mountManagement(createVm({ affinityHost: 'host-1' as FrontXoHost['id'] }))

  expect(findLabelledValues(wrapper)).toMatchObject({ 'Affinity host': 'Primary Host' })
})

it('falls back to "None" when the VM has no affinity host', () => {
  const wrapper = mountManagement(createVm({ affinityHost: undefined }))

  expect(findLabelledValues(wrapper)).toMatchObject({ 'Affinity host': 'None' })
})

it('shows the VM as protected from accidental deletion when destroy is blocked', () => {
  const wrapper = mountManagement(
    createVm({ blockedOperations: { [VM_OPERATIONS.DESTROY]: 'true' } as FrontXoVm['blockedOperations'] })
  )

  expect(findLabelledValues(wrapper)).toMatchObject({
    'Protect from accidental deletion': 'Enabled',
    'Protect from accidental shutdown': 'Disabled',
  })
})

it('shows the VM as protected from accidental shutdown when any shutdown operation is blocked', () => {
  const wrapper = mountManagement(
    createVm({
      blockedOperations: { [VM_OPERATIONS.HARD_SHUTDOWN]: 'true' } as FrontXoVm['blockedOperations'],
    })
  )

  expect(findLabelledValues(wrapper)).toMatchObject({
    'Protect from accidental deletion': 'Disabled',
    'Protect from accidental shutdown': 'Enabled',
  })
})

it('shows both protections as disabled when no operation is blocked', () => {
  const wrapper = mountManagement(createVm({ blockedOperations: {} as FrontXoVm['blockedOperations'] }))

  expect(findLabelledValues(wrapper)).toMatchObject({
    'Protect from accidental deletion': 'Disabled',
    'Protect from accidental shutdown': 'Disabled',
  })
})

it('shows whether the VM starts automatically with its pool', () => {
  const wrapper = mountManagement(createVm({ auto_poweron: true }))

  expect(findLabelledValues(wrapper)).toMatchObject({ 'Auto power': 'Enabled' })
})

describe('start delay', () => {
  function mountStartDelay(startDelay: number) {
    return findLabelledValues(mountManagement(createVm({ startDelay })))['Start delay']
  }

  it('spells out every non-zero unit of the delay', () => {
    expect(mountStartDelay(2 * 86_400 + 3 * 3_600 + 4 * 60 + 5)).toBe('2 days 3 hours 4 minutes 5 seconds')
  })

  it('omits the units the delay does not reach', () => {
    expect(mountStartDelay(3_600 + 30)).toBe('1 hour 30 seconds')
  })

  it('uses the singular wording for a delay of a single unit', () => {
    expect(mountStartDelay(86_400)).toBe('1 day')
  })

  it('falls back to zero seconds when the VM has no start delay', () => {
    expect(mountStartDelay(0)).toBe('0 seconds')
  })
})
