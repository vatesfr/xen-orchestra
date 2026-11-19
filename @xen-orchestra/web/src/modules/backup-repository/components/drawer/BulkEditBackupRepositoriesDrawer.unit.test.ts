import BulkEditBackupRepositoriesDrawer from '@/modules/backup-repository/components/drawer/BulkEditBackupRepositoriesDrawer.vue'
import BackupRepositoryDetailsStep from '@/modules/backup-repository/components/form/steps/BackupRepositoryDetailsStep.vue'
import BackupRepositoryGeneralStep from '@/modules/backup-repository/components/form/steps/BackupRepositoryGeneralStep.vue'
import type { BulkEditBackupRepositoryPayloads } from '@/modules/backup-repository/jobs/xo-backup-repository-bulk-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import { createBr } from '@/test/create-br.ts'
import { submitDrawer } from '@/test/drawer.ts'
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

const FIRST_NFS_BR = createBr({
  id: 'backup-repository-1' as FrontXoBackupRepository['id'],
  name: 'Nightly backups',
  url: 'nfs://192.168.1.10:2049:/exports/nightly',
})

const SECOND_NFS_BR = createBr({
  id: 'backup-repository-2' as FrontXoBackupRepository['id'],
  name: 'Weekly backups',
  url: 'nfs://192.168.1.10:2049:/exports/weekly',
})

const S3_BR = createBr({
  id: 'backup-repository-3' as FrontXoBackupRepository['id'],
  url: 's3+http://AKID:secret@minio.local:9000/bucket',
})

async function mountDrawer(brs: FrontXoBackupRepository[] = [FIRST_NFS_BR, SECOND_NFS_BR]) {
  const wrapper = mount(BulkEditBackupRepositoriesDrawer, {
    props: { brs },
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

it('shows the number of edited repositories in its title', async () => {
  const wrapper = await mountDrawer()

  expect(wrapper.text()).toContain(t('action:edit-n-brs', { n: 2 }))
})

it('shows the general information without the encryption', async () => {
  const wrapper = await mountDrawer()

  expect(wrapper.findComponent(BackupRepositoryGeneralStep).exists()).toBe(true)
  expect(wrapper.findComponent(FormCheckbox).exists()).toBe(false)
})

it('shows the details of the repositories when they are of the same type', async () => {
  const wrapper = await mountDrawer()

  expect(wrapper.findComponent(BackupRepositoryDetailsStep).exists()).toBe(true)
  expect(wrapper.get('.details-section > .ui-title').text()).toBe(t('br-type-details', { type: t('nfs') }))
  expect(getField(wrapper, t('host-or-ip-address')).get('input').element.value).toBe('192.168.1.10')
})

it('explains that the details cannot be edited for repositories of different types', async () => {
  const wrapper = await mountDrawer([FIRST_NFS_BR, S3_BR])

  expect(wrapper.findComponent(BackupRepositoryDetailsStep).exists()).toBe(false)
  expect(wrapper.get('.details-section .ui-alert').text()).toBe(t('multi-edit-brs-different-types'))
})

it('confirms with the payload of each repository when it is submitted', async () => {
  const wrapper = await mountDrawer()
  await fill(wrapper, t('host-or-ip-address'), '192.168.1.20')

  await submitDrawer(wrapper)

  const [[payloads]] = wrapper.emitted('confirm') as [[BulkEditBackupRepositoryPayloads]]

  expect([...payloads.keys()]).toEqual([FIRST_NFS_BR.id, SECOND_NFS_BR.id])
  expect([...payloads.values()].map(payload => parseBackupRepositoryUrl(payload.url).host)).toEqual([
    '192.168.1.20',
    '192.168.1.20',
  ])
})

it('does not confirm when it is submitted while invalid', async () => {
  const wrapper = await mountDrawer()
  await fill(wrapper, t('name'), '')

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
})
