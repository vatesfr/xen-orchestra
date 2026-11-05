import VmSystemResource from '@/modules/vm/components/system/VmSystemResource.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountResource(vm: FrontXoVm = createVm()) {
  return mount(VmSystemResource, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountResource()

  expect(wrapper.get('.ui-title').text()).toBe(t('resource-management'))
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
    [t('cpu-cap')]: '50',
    [t('cpu-mask')]: '0, 2',
    [t('cpu-weight')]: '512',
    [t('vcpu-at-startup')]: t('n-vcpus', 2),
    [t('maximum-vcpu')]: t('n-vcpus', 4),
    [t('vm-limit-topology')]: t('sockets-with-cores-per-socket', { nSockets: 2, nCores: 2 }),
    [t('minimum-static-memory')]: '1 GiB',
    [t('maximum-static-memory')]: '4 GiB',
    [t('minimum-dynamic-memory')]: '2 GiB',
    [t('maximum-dynamic-memory')]: '3 GiB',
    [t('gpus')]: 'vgpu-1, vgpu-2',
  })
})

it('leaves the CPU cap and weight empty when they are not set', () => {
  const wrapper = mountResource(createVm({ cpuCap: 0, cpuWeight: 0, cpuMask: [] }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('cpu-cap')]: '', [t('cpu-weight')]: '', [t('cpu-mask')]: '' })
})

it('falls back to the default behavior when the VM has no cores-per-socket topology', () => {
  const wrapper = mountResource(createVm({ coresPerSocket: undefined }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('vm-limit-topology')]: t('default-behavior') })
})

it('falls back to "None" when the VM has no GPU', () => {
  const wrapper = mountResource(createVm({ VGPUs: [] }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('gpus')]: t('none') })
})

it('uses the singular vCPU wording for a single vCPU', () => {
  const wrapper = mountResource(createVm({ CPUs: { number: 1, max: 1 } }))

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('vcpu-at-startup')]: t('n-vcpus', 1),
    [t('maximum-vcpu')]: t('n-vcpus', 1),
  })
})
