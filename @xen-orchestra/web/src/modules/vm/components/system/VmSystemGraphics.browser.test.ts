import VmSystemGraphics from '@/modules/vm/components/system/VmSystemGraphics.vue'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-vue'

function renderGraphics(vm = createVm()) {
  return render(VmSystemGraphics, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

test('renders the card title', async () => {
  const screen = renderGraphics()

  await expect.element(screen.getByText('Graphics & Display')).toBeVisible()
})

test('shows VGA as enabled when the VM uses the "std" adapter', async () => {
  const screen = renderGraphics(createVm({ vga: 'std' }))

  await expect.element(screen.getByText('Enabled')).toBeVisible()
})

test('shows VGA as disabled for any other adapter', async () => {
  const screen = renderGraphics(createVm({ vga: 'qxl' }))

  await expect.element(screen.getByText('Disabled')).toBeVisible()
})

test('formats the video RAM with its unit', async () => {
  const screen = renderGraphics(createVm({ videoram: 8 }))

  await expect.element(screen.getByText('8 B')).toBeVisible()
})

test('omits the video RAM value when the VM has none', async () => {
  const screen = renderGraphics(createVm({ videoram: 0 }))

  await expect.element(screen.getByText(/\d+\s*(B|KiB|MiB)/)).not.toBeInTheDocument()
})
