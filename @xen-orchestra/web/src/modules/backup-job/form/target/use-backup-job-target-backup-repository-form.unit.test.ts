import {
  type BackupJobTargetBackupRepositoryFormData,
  useBackupJobTargetBackupRepositoryForm,
} from '@/modules/backup-job/form/target/use-backup-job-target-backup-repository-form.ts'
import type {
  FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const PROXY_ID = 'proxy-1' as FrontXoProxy['id']

const NFS_BR = createBr({ id: 'br-nfs' as FrontXoBackupRepository['id'], url: 'nfs://192.168.1.10:/exports' })
const LOCAL_BR = createBr({ id: 'br-local' as FrontXoBackupRepository['id'], url: 'file:///var/backups' })
const PROXY_BR = createBr({ id: 'br-proxy' as FrontXoBackupRepository['id'], proxy: PROXY_ID })

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({
    proxies: ref([{ id: PROXY_ID, name: 'Proxy 1' }]),
  })) as unknown as typeof useXoProxyCollection,
}))

vi.mock(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
  useXoBackupRepositoryCollection: (() => ({
    backupRepositories: ref([NFS_BR, LOCAL_BR, PROXY_BR]),
    areBackupRepositoriesReady: ref(true),
  })) as unknown as typeof useXoBackupRepositoryCollection,
}))

function createBackupRepositoryFormData(): BackupJobTargetBackupRepositoryFormData {
  return {
    targetProxy: undefined,
    backupRepositoryScopeType: 'all',
    backupRepositoryIds: [],
    backupRepositoryFilter: '',
    backupDistribution: 'every',
    exportRetention: 3,
    ltrDailyRetention: 0,
    ltrDailyKeep: undefined,
    ltrWeeklyRetention: 0,
    ltrWeeklyKeep: undefined,
    ltrMonthlyRetention: 0,
    ltrMonthlyKeep: undefined,
    ltrYearlyRetention: 0,
    ltrYearlyKeep: undefined,
    strictGfs: false,
    mergeBackupsSynchronously: false,
  }
}

function mountBackupRepositoryForm(
  formData: Partial<BackupJobTargetBackupRepositoryFormData> = {},
  {
    isActive = true,
    hasRetentionStrategy = true,
    sourceBackupRepositoryId = undefined,
  }: {
    isActive?: boolean
    hasRetentionStrategy?: boolean
    sourceBackupRepositoryId?: FrontXoBackupRepository['id']
  } = {}
) {
  return mountComposable(() => {
    const { t } = useI18n()

    return {
      ...useBackupJobTargetBackupRepositoryForm(
        reactive({ ...createBackupRepositoryFormData(), ...formData }),
        ref(isActive),
        ref(hasRetentionStrategy),
        ref(sourceBackupRepositoryId)
      ),
      t,
    }
  }).wrapper.vm
}

describe('availableBackupRepositories', () => {
  it('offers every backup repository', () => {
    const form = mountBackupRepositoryForm()

    expect(form.availableBackupRepositories.map(br => br.id)).toEqual([NFS_BR.id, LOCAL_BR.id, PROXY_BR.id])
  })

  it('leaves out the source backup repository', () => {
    const form = mountBackupRepositoryForm({}, { sourceBackupRepositoryId: NFS_BR.id })

    expect(form.availableBackupRepositories.map(br => br.id)).toEqual([LOCAL_BR.id, PROXY_BR.id])
  })
})

describe('compatibleBackupRepositories', () => {
  it('keeps the backup repositories without proxy when no target proxy is selected', () => {
    const form = mountBackupRepositoryForm()

    expect(form.compatibleBackupRepositories.map(br => br.id)).toEqual([NFS_BR.id, LOCAL_BR.id])
  })

  it('keeps the backup repositories using the target proxy', () => {
    const form = mountBackupRepositoryForm({ targetProxy: PROXY_ID })

    expect(form.compatibleBackupRepositories.map(br => br.id)).toEqual([PROXY_BR.id])
  })
})

describe('matchedBackupRepositories', () => {
  it('matches the compatible backup repositories by type', () => {
    const form = mountBackupRepositoryForm({ backupRepositoryFilter: 'type:nfs' })

    expect(form.matchedBackupRepositories.map(br => br.id)).toEqual([NFS_BR.id])
  })
})

describe('formData', () => {
  it('drops the selected backup repositories which do not use the new target proxy', async () => {
    const form = mountBackupRepositoryForm({ backupRepositoryIds: [NFS_BR.id] })

    form.formData.targetProxy = PROXY_ID
    await flushPromises()

    expect(form.formData.backupRepositoryIds).toEqual([])
  })
})

describe('bindings', () => {
  it('explains which backup repositories can be selected without target proxy', () => {
    const form = mountBackupRepositoryForm()

    expect(form.bindings.targetProxy.info).toBe(form.t('only-backup-repositories-without-proxy'))
  })

  it('explains which backup repositories can be selected with a target proxy', () => {
    const form = mountBackupRepositoryForm({ targetProxy: PROXY_ID })

    expect(form.bindings.targetProxy.info).toBe(form.t('only-backup-repositories-using-this-proxy'))
  })
})

describe('validate', () => {
  it('accepts every backup repository', async () => {
    const form = mountBackupRepositoryForm()

    expect(await form.validate()).toBe(true)
  })

  it('requires the minimum backups to retain', async () => {
    const form = mountBackupRepositoryForm({ exportRetention: undefined })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.exportRetention.error).toMatchObject({
      content: form.t('minimum-backups-to-retain-mandatory'),
    })
  })

  it('requires at least 1 backup to retain', async () => {
    const form = mountBackupRepositoryForm({ exportRetention: 0 })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.exportRetention.error).toMatchObject({ content: form.t('must-be-at-least-n', { n: 1 }) })
  })

  it('requires at least one manually selected backup repository', async () => {
    const form = mountBackupRepositoryForm({ backupRepositoryScopeType: 'manual' })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.backupRepositoryIds.error).toMatchObject({
      content: form.t('select-at-least-one-backup-repository'),
    })
  })

  it('requires a query matching at least one backup repository', async () => {
    const form = mountBackupRepositoryForm({
      backupRepositoryScopeType: 'smart',
      backupRepositoryFilter: 'type:s3',
    })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.backupRepositoryFilter.error).toMatchObject({
      content: form.t('query-matches-no-backup-repository'),
    })
  })

  it('rejects a negative long term retention', async () => {
    const form = mountBackupRepositoryForm({ ltrWeeklyRetention: -1 })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.ltrWeeklyRetention.error).toMatchObject({
      content: form.t('must-be-at-least-n', { n: 0 }),
    })
  })

  it('ignores the long term retention without retention strategy', async () => {
    const form = mountBackupRepositoryForm({ ltrWeeklyRetention: -1 }, { hasRetentionStrategy: false })

    expect(await form.validate()).toBe(true)
  })

  it('ignores the backup repositories when they are not a storage target', async () => {
    const form = mountBackupRepositoryForm(
      { backupRepositoryScopeType: 'manual', exportRetention: undefined },
      { isActive: false }
    )

    expect(await form.validate()).toBe(true)
  })
})

describe('getKeepLabel', () => {
  it('keeps the first backup of the period by default', () => {
    const form = mountBackupRepositoryForm()

    expect(form.getKeepLabel('daily', undefined)).toBe(form.t('first-of-day'))
  })

  it('labels the hour of the daily backup to keep', () => {
    const form = mountBackupRepositoryForm()

    expect(form.getKeepLabel('daily', 2)).toBe('02:00')
  })
})

describe('getDistributionLabel', () => {
  it('labels the backup distribution', () => {
    const form = mountBackupRepositoryForm()

    expect(form.getDistributionLabel('every')).toBe(form.t('store-backups-on-every-backup-repository'))
  })
})

describe('getScopeTypeLabel', () => {
  it('labels the scope type with the backup repositories', () => {
    const form = mountBackupRepositoryForm()

    expect(form.getScopeTypeLabel('all')).toBe(form.t('all-objects-brs'))
  })
})
