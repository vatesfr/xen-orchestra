import DockerContainerTreeItem from '@/modules/treeview/components/DockerContainerTreeItem.vue'
import type { DockerContainerLeaf } from '@/modules/treeview/types/tree.type.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

const leaf = (id: string) =>
  ({
    data: { id, dockerId: id.padEnd(64, '0'), name: id, state: 'running', $engine: 'e-a', $VM: 'vm-a' },
  }) as unknown as DockerContainerLeaf

async function isActive(id: string, path: string) {
  const router = createTestRouter()
  await router.push(path)
  const wrapper = mount(DockerContainerTreeItem, {
    props: { leaf: leaf(id) },
    global: createGlobalTestConfig({ router }),
  })

  expect(wrapper.find('a').attributes('href')).toBe(`/vm/vm-a/containers?id=${id}`)

  return wrapper.find('.ui-tree-item-label').classes().includes('exact-active')
}

// `RouterLink` ignores the query: without `active`, every container of the VM would be highlighted
it('is active only when it is the selected container', async () => {
  expect(await isActive('web', '/vm/vm-a/containers?id=web')).toBe(true)
  expect(await isActive('db', '/vm/vm-a/containers?id=web')).toBe(false)
  expect(await isActive('web', '/vm/vm-a/containers')).toBe(false)
})
