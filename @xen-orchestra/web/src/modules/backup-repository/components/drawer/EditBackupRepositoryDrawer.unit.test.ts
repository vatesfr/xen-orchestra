import EditBackupRepositoryDrawer from '@/modules/backup-repository/components/drawer/EditBackupRepositoryDrawer.vue'
import BackupRepositoryDetailsStep from '@/modules/backup-repository/components/form/steps/BackupRepositoryDetailsStep.vue'
import BackupRepositoryGeneralStep from '@/modules/backup-repository/components/form/steps/BackupRepositoryGeneralStep.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { computed, ref } from 'vue'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({
    proxies: ref([]),
    useGetProxyById: () => computed(() => undefined),
  })) as unknown as typeof useXoProxyCollection,
}))

const NFS_BR = createBr({ name: 'Nightly backups', url: 'nfs://192.168.1.10:2049:/exports/backups' })

async function mountDrawer(br: FrontXoBackupRepository = NFS_BR) {
  const wrapper = mount(EditBackupRepositoryDrawer, {
    props: { br },
    global: createGlobalTestConfig(),
    attachTo: document.body,
  })
  await flushPromises()

  return wrapper
}

function getField(wrapper: VueWrapper, label: string) {
  const field = wrapper.findAll('.vts-input-wrapper').find(field => field.get('.ui-label').text().includes(label))

  if (field === undefined) {
    throw new Error(`No field labelled "${label}"`)
  }

  return field
}

async function fill(wrapper: VueWrapper, label: string, value: string) {
  await getField(wrapper, label).get('input').setValue(value)
}

async function submit(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

it('shows the general information and the details of the repository type together', async () => {
  const wrapper = await mountDrawer()

  expect(wrapper.findComponent(BackupRepositoryGeneralStep).exists()).toBe(true)
  expect(wrapper.findComponent(BackupRepositoryDetailsStep).exists()).toBe(true)
  expect(wrapper.get('.details-section > .ui-title').text()).toBe(t('br-type-details', { type: t('nfs') }))
})

it('fills the fields from the repository', async () => {
  const wrapper = await mountDrawer()

  expect(getField(wrapper, t('name')).get('input').element.value).toBe('Nightly backups')
  expect(getField(wrapper, t('host-or-ip-address')).get('input').element.value).toBe('192.168.1.10')
})

it('offers to cancel or to save', async () => {
  const wrapper = await mountDrawer()

  expect(wrapper.findAll('.buttons button').map(button => button.text())).toEqual([t('cancel'), t('action:save')])
})

it('cancels from the cancel button', async () => {
  const wrapper = await mountDrawer()

  await wrapper.get('.buttons button').trigger('click')

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('confirms with the edited repository when it is submitted', async () => {
  const wrapper = await mountDrawer()
  await fill(wrapper, t('name'), 'Weekly backups')
  await fill(wrapper, t('host-or-ip-address'), '192.168.1.20')

  await submit(wrapper)

  const [[payload]] = wrapper.emitted('confirm') as [[{ name: string; url: string }]]

  expect(payload.name).toBe('Weekly backups')
  expect(parseBackupRepositoryUrl(payload.url)).toMatchObject({ host: '192.168.1.20' })
})

it('does not confirm when it is submitted while invalid', async () => {
  const wrapper = await mountDrawer()
  await fill(wrapper, t('name'), '')

  await submit(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
})
