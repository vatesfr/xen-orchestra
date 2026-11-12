import {
  type BackupJobTargetStorageRepositoryFormData,
  useBackupJobTargetStorageRepositoryForm,
} from '@/modules/backup-job/form/target/use-backup-job-target-storage-repository-form.ts'
import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const POOL_ID = 'pool-1' as FrontXoPool['id']

const LOCAL_SR = createSr({ id: 'sr-local' as FrontXoSr['id'], name_label: 'Local storage', $pool: POOL_ID })
const NFS_SR = createSr({ id: 'sr-nfs' as FrontXoSr['id'], name_label: 'NFS storage', SR_type: 'nfs' })
const ISO_SR = createSr({ id: 'sr-iso' as FrontXoSr['id'], name_label: 'ISO library', content_type: 'iso' })

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({
    srs: ref([LOCAL_SR, NFS_SR, ISO_SR]),
    areSrsReady: ref(true),
  })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    getPoolById: (id: FrontXoPool['id']) =>
      id === POOL_ID ? createPool({ id: POOL_ID, name_label: 'Main pool' }) : undefined,
  })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({
    getPbdsByIds: () => [],
    pbdsBySr: ref(new Map()),
  })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById: () => undefined })) as unknown as typeof useXoHostCollection,
}))

function createStorageRepositoryFormData(): BackupJobTargetStorageRepositoryFormData {
  return {
    storageRepositoryScopeType: 'all',
    storageRepositoryIds: [],
    storageRepositoryFilter: '',
    replicaDistribution: 'every',
    copyRetention: 2,
  }
}

function mountStorageRepositoryForm(formData: Partial<BackupJobTargetStorageRepositoryFormData> = {}, isActive = true) {
  return mountComposable(() => {
    const { t } = useI18n()

    return {
      ...useBackupJobTargetStorageRepositoryForm(
        reactive({ ...createStorageRepositoryFormData(), ...formData }),
        ref(isActive)
      ),
      t,
    }
  }).wrapper.vm
}

describe('availableStorageRepositories', () => {
  it('offers the writable SRs only', () => {
    const form = mountStorageRepositoryForm()

    expect(form.availableStorageRepositories.map(sr => sr.id)).toEqual([LOCAL_SR.id, NFS_SR.id])
  })
})

describe('matchedStorageRepositories', () => {
  it('matches no SR without query', () => {
    const form = mountStorageRepositoryForm()

    expect(form.matchedStorageRepositories).toEqual([])
  })

  it('matches the SRs by their type, as the backups resolve it', () => {
    const form = mountStorageRepositoryForm({ storageRepositoryFilter: 'type:nfs' })

    expect(form.matchedStorageRepositories.map(sr => sr.id)).toEqual([NFS_SR.id])
  })

  it('matches nothing on a property unknown to the backups', () => {
    const form = mountStorageRepositoryForm({ storageRepositoryFilter: 'SR_type:nfs' })

    expect(form.matchedStorageRepositories).toEqual([])
  })
})

describe('validate', () => {
  it('accepts every SR', async () => {
    const form = mountStorageRepositoryForm()

    expect(await form.validate()).toBe(true)
  })

  it('requires at least one manually selected SR', async () => {
    const form = mountStorageRepositoryForm({ storageRepositoryScopeType: 'manual' })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.storageRepositoryIds.error).toMatchObject({
      content: form.t('select-at-least-one-storage-repository'),
    })
  })

  it('requires the query of a dynamic selection', async () => {
    const form = mountStorageRepositoryForm({ storageRepositoryScopeType: 'smart' })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.storageRepositoryFilter.error).toMatchObject({ content: form.t('query-required') })
  })

  it('requires a query matching at least one SR', async () => {
    const form = mountStorageRepositoryForm({
      storageRepositoryScopeType: 'smart',
      storageRepositoryFilter: 'name_label:unknown',
    })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.storageRepositoryFilter.error).toMatchObject({
      content: form.t('query-matches-no-storage-repository'),
    })
  })

  it('accepts a query matching an SR', async () => {
    const form = mountStorageRepositoryForm({
      storageRepositoryScopeType: 'smart',
      storageRepositoryFilter: 'type:nfs',
    })

    expect(await form.validate()).toBe(true)
  })

  it('requires the minimum replicas to retain', async () => {
    const form = mountStorageRepositoryForm({ copyRetention: undefined })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.copyRetention.error).toMatchObject({
      content: form.t('minimum-replicas-to-retain-mandatory'),
    })
  })

  it('requires at least 1 replica to retain', async () => {
    const form = mountStorageRepositoryForm({ copyRetention: 0 })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.copyRetention.error).toMatchObject({ content: form.t('must-be-at-least-n', { n: 1 }) })
  })

  it('ignores the SRs when they are not a storage target', async () => {
    const form = mountStorageRepositoryForm({ storageRepositoryScopeType: 'manual', copyRetention: undefined }, false)

    expect(await form.validate()).toBe(true)
  })
})

describe('getScopeTypeLabel', () => {
  it('labels the scope type with the SRs', () => {
    const form = mountStorageRepositoryForm()

    expect(form.getScopeTypeLabel('all')).toBe(form.t('all-objects-srs'))
    expect(form.getScopeTypeLabel('manual')).toBe(form.t('manual-selection'))
  })
})

describe('getDistributionLabel', () => {
  it('labels the replica distribution', () => {
    const form = mountStorageRepositoryForm()

    expect(form.getDistributionLabel('distribute')).toBe(form.t('distribute-replicas-across-storage-repositories'))
  })
})
