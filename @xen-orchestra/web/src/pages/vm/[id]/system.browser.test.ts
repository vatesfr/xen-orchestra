import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VmSystemPage from '@/pages/vm/[id]/system.vue'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-vue'

function renderSystemPage(vm = createVm()) {
  return render(VmSystemPage, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

test('renders every system card title', async () => {
  const screen = renderSystemPage()

  await expect.element(screen.getByText('General information')).toBeVisible()
  await expect.element(screen.getByText('Networking')).toBeVisible()
  await expect.element(screen.getByText('Storage configuration')).toBeVisible()
  await expect.element(screen.getByText('Resource management')).toBeVisible()
  await expect.element(screen.getByText('Virtualization & Boot')).toBeVisible()
  await expect.element(screen.getByText('VM management', { exact: true })).toBeVisible()
  await expect.element(screen.getByText('Graphics & Display')).toBeVisible()
})

test('shows the VM general information from the prop', async () => {
  const screen = renderSystemPage(createVm({ name_label: 'My Web Server', id: 'vm-abc' as FrontXoVm['id'] }))

  await expect.element(screen.getByText('My Web Server')).toBeVisible()
  await expect.element(screen.getByText('vm-abc')).toBeVisible()
})
