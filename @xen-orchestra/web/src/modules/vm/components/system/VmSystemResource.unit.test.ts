import VmSystemResource from '@/modules/vm/components/system/VmSystemResource.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

function mountResource(vm: FrontXoVm = createVm()) {
  return mount(VmSystemResource, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountResource()

  expect(wrapper.get('.ui-title').text()).toBe('Resource management')
})

it('shows every CPU, memory and GPU resource of the VM', () => {
  const wrapper = mountResource(
    createVm({
      cpuCap: 50,
      cpuMask: [0, 2],
      cpuWeight: 512,
      CPUs: { number: 2, max: 4 },
      coresPerSocket: 2,
      memory: {
        size: 4294967296,
        static: [1073741824, 4294967296],
        dynamic: [2147483648, 3221225472],
      },
      VGPUs: ['vgpu-1', 'vgpu-2'] as FrontXoVm['VGPUs'],
    })
  )

  expect(findLabelledValues(wrapper)).toEqual({
    'CPU cap': '50',
    'CPU mask': '0, 2',
    'CPU weight': '512',
    'vCPU at startup': '2 vCPUs',
    'Maximum vCPUs': '4 vCPUs',
    'VM limit topology': '2 sockets × 2 cores/socket',
    'Minimum static memory': '1 GiB',
    'Maximum static memory': '4 GiB',
    'Minimum dynamic memory': '2 GiB',
    'Maximum dynamic memory': '3 GiB',
    GPUs: 'vgpu-1, vgpu-2',
  })
})

it('leaves the CPU cap and weight empty when they are not set', () => {
  const wrapper = mountResource(createVm({ cpuCap: 0, cpuWeight: 0, cpuMask: [] }))

  expect(findLabelledValues(wrapper)).toMatchObject({ 'CPU cap': '', 'CPU weight': '', 'CPU mask': '' })
})

it('falls back to the default behavior when the VM has no cores-per-socket topology', () => {
  const wrapper = mountResource(createVm({ coresPerSocket: undefined }))

  expect(findLabelledValues(wrapper)).toMatchObject({ 'VM limit topology': 'Default behavior' })
})

it('falls back to "None" when the VM has no GPU', () => {
  const wrapper = mountResource(createVm({ VGPUs: [] }))

  expect(findLabelledValues(wrapper)).toMatchObject({ GPUs: 'None' })
})

it('uses the singular vCPU wording for a single vCPU', () => {
  const wrapper = mountResource(createVm({ CPUs: { number: 1, max: 1 } }))

  expect(findLabelledValues(wrapper)).toMatchObject({ 'vCPU at startup': '1 vCPU', 'Maximum vCPUs': '1 vCPU' })
})
