import { useXo5VmRoute } from '@/modules/vm/composables/xo-vm-route-xo5.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { mountComposable } from '@/test/mount-composable.ts'

mockXoRoutes()

it('builds the XO5 general, stats and advanced routes for the VM id', () => {
  const { wrapper } = mountComposable(() => useXo5VmRoute(createVm({ id: 'vm-42' as FrontXoVm['id'] })))

  expect(wrapper.vm.xo5VmGeneralHref).toBe('https://xo5.example.com/#/vms/vm-42/general')
  expect(wrapper.vm.xo5VmStatsHref).toBe('https://xo5.example.com/#/vms/vm-42/stats')
  expect(wrapper.vm.xo5VmAdvancedHref).toBe('https://xo5.example.com/#/vms/vm-42/advanced')
})
