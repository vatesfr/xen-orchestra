import ContainerHostsTable from '@/modules/docker/components/list/ContainerHostsTable.vue'
import type { FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'
import { getDockerTreeHosts } from '@/modules/docker/utils/xo-docker-tree.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createDockerEngine } from '@/test/create-docker-container.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

const VMS = [
  createVm({ id: 'vm-a' as FrontXoVm['id'], name_label: 'alpha' }),
  createVm({ id: 'vm-b' as FrontXoVm['id'], name_label: 'beta' }),
]

const HOSTS = getDockerTreeHosts(
  [
    createDockerEngine({ id: 'e-a' as FrontXoDockerEngine['id'], $VM: VMS[0].id, kind: 'docker' }),
    createDockerEngine({ id: 'e-b' as FrontXoDockerEngine['id'], $VM: VMS[1].id, kind: 'podman' }),
  ],
  id => VMS.find(vm => vm.id === id)
)

function mountTable() {
  return mount(ContainerHostsTable, {
    props: { hosts: HOSTS },
    global: createGlobalTestConfig({ router: createTestRouter() }),
  })
}

const findLinks = (wrapper: VueWrapper) =>
  wrapper.findAll('tbody a').map(link => [link.text(), link.attributes('href')])

it('links each container host to the Containers tab of its VM', () => {
  expect(findLinks(mountTable())).toEqual([
    ['alpha', '/vm/vm-a/containers'],
    ['beta', '/vm/vm-b/containers'],
  ])
})

it('filters the container hosts on their name or kind', async () => {
  const wrapper = mountTable()

  await wrapper.find('.ui-query-search-bar input').setValue('podman')
  await wrapper.find('.ui-query-search-bar').trigger('submit')

  expect(findLinks(wrapper)).toEqual([['beta', '/vm/vm-b/containers']])
})
