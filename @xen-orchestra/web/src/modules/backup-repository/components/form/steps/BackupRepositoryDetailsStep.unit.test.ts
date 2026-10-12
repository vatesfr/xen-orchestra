import BackupRepositoryAzureFields from '@/modules/backup-repository/components/form/fields/BackupRepositoryAzureFields.vue'
import BackupRepositoryLocalFields from '@/modules/backup-repository/components/form/fields/BackupRepositoryLocalFields.vue'
import BackupRepositoryNfsFields from '@/modules/backup-repository/components/form/fields/BackupRepositoryNfsFields.vue'
import BackupRepositoryS3Fields from '@/modules/backup-repository/components/form/fields/BackupRepositoryS3Fields.vue'
import BackupRepositorySmbFields from '@/modules/backup-repository/components/form/fields/BackupRepositorySmbFields.vue'
import BackupRepositoryDetailsStep from '@/modules/backup-repository/components/form/steps/BackupRepositoryDetailsStep.vue'
import { useNewBackupRepositoryForm } from '@/modules/backup-repository/form/use-new-backup-repository-form.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import type { BackupRepositoryType } from 'xo-remote-parser'

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({ proxies: ref([]) })) as unknown as typeof useXoProxyCollection,
}))

const FIELDS = {
  local: BackupRepositoryLocalFields,
  nfs: BackupRepositoryNfsFields,
  smb: BackupRepositorySmbFields,
  s3: BackupRepositoryS3Fields,
  azure: BackupRepositoryAzureFields,
}

type FieldsName = keyof typeof FIELDS

function mountDetailsStep(type?: BackupRepositoryType) {
  const { details } = mountComposable(() => useNewBackupRepositoryForm()).wrapper.vm

  return mount(BackupRepositoryDetailsStep, {
    props: { type, details },
    global: createGlobalTestConfig(),
  })
}

function findRenderedFields(wrapper: VueWrapper) {
  return (Object.keys(FIELDS) as FieldsName[]).filter(name => wrapper.findComponent(FIELDS[name]).exists())
}

it('renders no field until a type is selected', () => {
  expect(findRenderedFields(mountDetailsStep())).toEqual([])
})

it.each<[BackupRepositoryType, FieldsName]>([
  ['file', 'local'],
  ['nfs', 'nfs'],
  ['smb', 'smb'],
  ['s3', 's3'],
  ['azure', 'azure'],
  ['azurite', 'azure'],
])('renders only the fields of the %s type', (type, fieldsName) => {
  expect(findRenderedFields(mountDetailsStep(type))).toEqual([fieldsName])
})

it('offers the HTTPS setting for the azurite type only', () => {
  const isAzurite = (type: BackupRepositoryType) =>
    mountDetailsStep(type).getComponent(BackupRepositoryAzureFields).props('isAzurite')

  expect({ azure: isAzurite('azure'), azurite: isAzurite('azurite') }).toEqual({ azure: false, azurite: true })
})
