import type { BackupJobTargetBackupRepositoryFormData } from '@/modules/backup-job/form/target/use-backup-job-target-backup-repository-form.ts'
import type { BackupJobTargetHealthCheckFormData } from '@/modules/backup-job/form/target/use-backup-job-target-health-check-form.ts'
import type { BackupJobTargetStorageRepositoryFormData } from '@/modules/backup-job/form/target/use-backup-job-target-storage-repository-form.ts'
import type { BackupJobPlanningFormData } from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import type { BackupJobSourceFormData } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import type { BackupJobTargetFormData } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import type { BackupJobTransferFormData } from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import {
  type BackupJobFormDataSet,
  toBackupJobPayload,
  toRunExpression,
} from '@/modules/backup-job/utils/backup-job-payload.util.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { parse } from 'complex-matcher'

const VM_ID = 'vm-1' as FrontXoVm['id']
const POOL_ID = 'pool-1' as FrontXoPool['id']
const BR_ID = 'br-1' as FrontXoBackupRepository['id']
const SOURCE_BR_ID = 'br-source' as FrontXoBackupRepository['id']
const SR_ID = 'sr-1' as FrontXoSr['id']
const PROXY_ID = 'proxy-1' as FrontXoProxy['id']
const SOURCE_PROXY_ID = 'proxy-source' as FrontXoProxy['id']

const SOURCE: BackupJobSourceFormData = {
  name: 'Daily backup',
  enabled: true,
  dataSource: 'vm',
  mode: 'delta',
  saveXoConfig: false,
  savePoolsMetadata: true,
  proxy: undefined,
  sourceBackupRepository: undefined,
  scopeType: 'all',
  vmIds: [],
  vmFilter: '',
  poolIds: [],
  poolFilter: '',
}

const TRANSFER: BackupJobTransferFormData = {
  maxExportRate: undefined,
  concurrency: 2,
  compression: '',
  keyBackup: 'never',
  keyBackupMonthDays: [],
  keyBackupWeekDays: [],
  keyBackupHours: [],
  preferNbd: true,
  nbdConcurrency: 1,
  offlineBackup: false,
  snapshotMode: 'default',
  snapshotSync: 'none',
  snapshotSyncTag: undefined,
  snapshotRetention: 1,
}

const BACKUP_REPOSITORY: BackupJobTargetBackupRepositoryFormData = {
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

const STORAGE_REPOSITORY: BackupJobTargetStorageRepositoryFormData = {
  storageRepositoryScopeType: 'all',
  storageRepositoryIds: [],
  storageRepositoryFilter: '',
  replicaDistribution: 'every',
  copyRetention: 2,
}

const HEALTH_CHECK: BackupJobTargetHealthCheckFormData = {
  healthCheckEnabled: false,
  healthCheckSr: undefined,
  healthCheckVmTags: [],
  healthCheckTimeout: 10,
  healthCheckSchedule: 'always',
  healthCheckMonthDays: [],
  healthCheckWeekDays: [],
  healthCheckHours: [],
}

const PLANNING: BackupJobPlanningFormData = {
  cron: '0 0 * * *',
  timezone: 'Europe/Paris',
  timeout: undefined,
  nRetriesVmBackupFailures: undefined,
  reportWhen: 'failure',
  reportRecipients: [],
  hideSuccessfulItems: false,
}

function createFormDataSet({
  source,
  transfer,
  target,
  backupRepository,
  storageRepository,
  healthCheck,
  planning,
}: {
  source?: Partial<BackupJobSourceFormData>
  transfer?: Partial<BackupJobTransferFormData>
  target?: Partial<Pick<BackupJobTargetFormData, 'storageTargets'>>
  backupRepository?: Partial<BackupJobTargetBackupRepositoryFormData>
  storageRepository?: Partial<BackupJobTargetStorageRepositoryFormData>
  healthCheck?: Partial<BackupJobTargetHealthCheckFormData>
  planning?: Partial<BackupJobPlanningFormData>
} = {}): BackupJobFormDataSet {
  return {
    source: { ...SOURCE, ...source },
    transfer: { ...TRANSFER, ...transfer },
    target: {
      storageTargets: ['backup-repository'],
      ...target,
      backupRepository: { ...BACKUP_REPOSITORY, ...backupRepository },
      storageRepository: { ...STORAGE_REPOSITORY, ...storageRepository },
      healthCheck: { ...HEALTH_CHECK, ...healthCheck },
    },
    planning: { ...PLANNING, ...planning },
    allIds: { backupRepositories: [BR_ID], pools: [POOL_ID] },
  }
}

describe('toBackupJobPayload', () => {
  describe('VM backup', () => {
    it('builds an incremental backup of every VM on every backup repository', () => {
      expect(toBackupJobPayload(createFormDataSet())).toEqual({
        type: 'backup',
        name: 'Daily backup',
        mode: 'delta',
        vms: {},
        remotes: '*',
        schedules: { schedule: { cron: '0 0 * * *', timezone: 'Europe/Paris', enabled: true } },
        settings: {
          '': { concurrency: 2, preferNbd: true, nbdConcurrency: 1, timezone: 'Europe/Paris', reportWhen: 'failure' },
          schedule: { exportRetention: 3, snapshotRetention: 1 },
        },
      })
    })

    it('targets the manually selected VMs', () => {
      const payload = toBackupJobPayload(createFormDataSet({ source: { scopeType: 'manual', vmIds: [VM_ID] } }))

      expect(payload).toMatchObject({ vms: { id: { __or: [VM_ID] } } })
    })

    it('targets the VMs matching the dynamic selection query', () => {
      const payload = toBackupJobPayload(createFormDataSet({ source: { scopeType: 'smart', vmFilter: 'tags:prod' } }))

      expect(payload).toMatchObject({ vms: 'tags:prod' })
    })

    it('compresses a full backup, without NBD nor key backup', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({ source: { mode: 'full' }, transfer: { compression: 'zstd' } })
      )

      expect(payload).toMatchObject({ mode: 'full', compression: 'zstd' })
      expect(payload.settings['']).not.toHaveProperty('preferNbd', expect.anything())
      expect(payload.settings['']).not.toHaveProperty('nbdConcurrency', expect.anything())
      expect(payload.settings.schedule).not.toHaveProperty('fullInterval', expect.anything())
    })

    it('makes a key backup on every run', () => {
      const payload = toBackupJobPayload(createFormDataSet({ transfer: { keyBackup: 'always' } }))

      expect(payload.settings.schedule).toMatchObject({ fullInterval: 1 })
    })

    it('makes a key backup on the selected days and hours', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({
          transfer: { keyBackup: 'dynamic', keyBackupMonthDays: [1], keyBackupWeekDays: [1], keyBackupHours: [2] },
        })
      )

      expect(payload.settings.schedule).toMatchObject({ fullInterval: 'run:(|(dayOfMonth:1 dayOfWeek:1) hour:2)' })
    })

    it('converts the timeout to milliseconds and the speed limit to bytes', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({ transfer: { maxExportRate: 10 }, planning: { timeout: 2 } })
      )

      expect(payload.settings['']).toMatchObject({ maxExportRate: 10 * 1024 ** 2, timeout: 2 * 3600e3 })
    })

    it('destroys the CBT snapshot data of an ephemeral snapshot with NBD', () => {
      const payload = toBackupJobPayload(createFormDataSet({ transfer: { snapshotRetention: 0 } }))

      expect(payload.settings['']).toMatchObject({ cbtDestroySnapshotData: true })
    })

    it('keeps no snapshot for an offline backup', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({
          transfer: { offlineBackup: true, snapshotMode: 'with-memory', snapshotSync: 'all', snapshotRetention: 5 },
        })
      )

      expect(payload.settings['']).toMatchObject({ offlineBackup: true })
      expect(payload.settings['']).not.toHaveProperty('checkpointSnapshot', expect.anything())
      expect(payload.settings['']).not.toHaveProperty('synchronizedSnapshot', expect.anything())
      expect(payload.settings.schedule).toMatchObject({ snapshotRetention: 0 })
    })

    it('synchronises the snapshots of every VM', () => {
      const payload = toBackupJobPayload(createFormDataSet({ transfer: { snapshotSync: 'all' } }))

      expect(payload.settings['']).toMatchObject({ synchronizedSnapshot: true })
    })

    it('synchronises the snapshots of the VMs with a tag', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({ transfer: { snapshotSync: 'smart', snapshotSyncTag: 'prod' } })
      )

      expect(payload.settings['']).toMatchObject({ synchronizedSnapshot: 'prod' })
    })

    it('snapshots the VM memory', () => {
      const payload = toBackupJobPayload(createFormDataSet({ transfer: { snapshotMode: 'with-memory' } }))

      expect(payload.settings['']).toMatchObject({ checkpointSnapshot: true })
    })

    it('shuts the VM down to snapshot it', () => {
      const payload = toBackupJobPayload(createFormDataSet({ transfer: { snapshotMode: 'offline' } }))

      expect(payload.settings['']).toMatchObject({ offlineSnapshot: true })
    })

    it('keeps the long term retentions above 0', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({ backupRepository: { ltrDailyRetention: 7, ltrMonthlyRetention: 0 } })
      )

      expect(payload.settings['']).toMatchObject({ longTermRetention: { daily: { retention: 7, settings: {} } } })
    })

    it('starts each long term retention period on the backup to keep', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({
          backupRepository: {
            ltrDailyRetention: 7,
            ltrDailyKeep: 7,
            ltrWeeklyRetention: 4,
            ltrWeeklyKeep: 1,
            ltrMonthlyRetention: 12,
            ltrMonthlyKeep: 5,
            ltrYearlyRetention: 2,
            ltrYearlyKeep: 2,
          },
        })
      )

      expect(payload.settings['']).toMatchObject({
        longTermRetention: {
          daily: { retention: 7, settings: { firstHourOfTheDay: 7 } },
          weekly: { retention: 4, settings: { firstDayOfWeek: 1 } },
          monthly: { retention: 12, settings: { firstDayOfMonth: 4 } },
          yearly: { retention: 2, settings: { firstDayOfYear: 59 } },
        },
      })
    })

    it('stores the backups on the selected backup repositories through the target proxy', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({
          backupRepository: {
            targetProxy: PROXY_ID,
            backupRepositoryScopeType: 'manual',
            backupRepositoryIds: [BR_ID],
          },
        })
      )

      expect(payload).toMatchObject({ proxy: PROXY_ID, remotes: { id: { __or: [BR_ID] } } })
    })

    it('replicates on storage repositories only', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({
          target: { storageTargets: ['storage-repository'] },
          backupRepository: { targetProxy: PROXY_ID },
          storageRepository: { storageRepositoryScopeType: 'manual', storageRepositoryIds: [SR_ID] },
        })
      )

      expect(payload).toMatchObject({ srs: { id: { __or: [SR_ID] } } })
      expect(payload).not.toHaveProperty('proxy', expect.anything())
      expect(payload).not.toHaveProperty('remotes', expect.anything())
      expect(payload.settings.schedule).toEqual({ copyRetention: 2, snapshotRetention: 1 })
    })

    it('replicates on every storage repository', () => {
      const payload = toBackupJobPayload(createFormDataSet({ target: { storageTargets: ['storage-repository'] } }))

      expect(payload).toMatchObject({ srs: '*' })
    })

    it('distributes the backups and the replicas', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({
          target: { storageTargets: ['backup-repository', 'storage-repository'] },
          backupRepository: { backupDistribution: 'distribute' },
          storageRepository: { replicaDistribution: 'distribute' },
        })
      )

      expect(payload.settings['']).toMatchObject({ distributeBackups: true, distributeReplications: true })
    })

    it('distributes nothing when the backups and the replicas go to every target', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({ target: { storageTargets: ['backup-repository', 'storage-repository'] } })
      )

      expect(payload.settings['']).not.toHaveProperty('distributeBackups', expect.anything())
      expect(payload.settings['']).not.toHaveProperty('distributeReplications', expect.anything())
    })

    it('scopes the dynamic selection queries of the targets to their expression context', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({
          target: { storageTargets: ['backup-repository', 'storage-repository'] },
          backupRepository: { backupRepositoryScopeType: 'smart', backupRepositoryFilter: 'name:test' },
          storageRepository: { storageRepositoryScopeType: 'smart', storageRepositoryFilter: 'name_label:nfs' },
        })
      )

      expect(payload).toMatchObject({ remotes: 'backupRepository:(name:test)', srs: 'sr:(name_label:nfs)' })
    })

    it('checks the health of the backups', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({
          healthCheck: {
            healthCheckEnabled: true,
            healthCheckSr: SR_ID,
            healthCheckVmTags: ['prod'],
          },
        })
      )

      expect(payload.settings['']).toMatchObject({ healthCheckVmsWithTags: ['prod'], healthCheckTimeout: '10m' })
      expect(payload.settings.schedule).toMatchObject({ healthCheckSr: SR_ID })
    })

    it('checks the health of every VM on the selected days and hours', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({
          healthCheck: {
            healthCheckEnabled: true,
            healthCheckSr: SR_ID,
            healthCheckSchedule: 'dynamic',
            healthCheckWeekDays: [1],
            healthCheckHours: [2],
          },
        })
      )

      expect(payload.settings['']).toMatchObject({ healthCheckVmsWithTags: 'run:(dayOfWeek:1 hour:2)' })
    })

    it('checks the health of the VMs with exactly one of the tags, on the selected days and hours', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({
          healthCheck: {
            healthCheckEnabled: true,
            healthCheckSr: SR_ID,
            healthCheckVmTags: ['prod', 'team/a'],
            healthCheckSchedule: 'dynamic',
            healthCheckWeekDays: [1],
            healthCheckHours: [2],
          },
        })
      )
      const expression = payload.settings['']?.healthCheckVmsWithTags as string
      const isChecked = (tags: string[], dayOfWeek: number) =>
        parse(expression).createPredicate()({ vm: { tags }, run: { dayOfMonth: 10, dayOfWeek, hour: 2 } })

      expect(expression).toBe('vm:tags:|(/^prod$/ /^team\\/a$/) run:(dayOfWeek:1 hour:2)')
      expect(isChecked(['prod'], 1)).toBe(true)
      expect(isChecked(['team/a'], 1)).toBe(true)
      expect(isChecked(['production'], 1)).toBe(false)
      expect(isChecked(['prod'], 2)).toBe(false)
    })

    it('sends the reports to the recipients, hiding the successful items', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({ planning: { reportRecipients: ['admin@example.com'], hideSuccessfulItems: true } })
      )

      expect(payload.settings['']).toMatchObject({
        reportRecipients: ['admin@example.com'],
        hideSuccessfulItems: true,
      })
    })

    it('disables the schedule of a disabled job', () => {
      const payload = toBackupJobPayload(createFormDataSet({ source: { enabled: false } }))

      expect(payload.schedules).toEqual({ schedule: { cron: '0 0 * * *', timezone: 'Europe/Paris', enabled: false } })
    })
  })

  describe('mirror backup', () => {
    const MIRROR_SOURCE: Partial<BackupJobSourceFormData> = {
      dataSource: 'mirror',
      proxy: SOURCE_PROXY_ID,
      sourceBackupRepository: SOURCE_BR_ID,
    }

    it('copies every VM backup of the source backup repository', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({ source: MIRROR_SOURCE, backupRepository: { targetProxy: PROXY_ID } })
      )

      expect(payload).toMatchObject({
        type: 'mirrorBackup',
        mode: 'delta',
        proxy: SOURCE_PROXY_ID,
        sourceRemote: SOURCE_BR_ID,
        remotes: { id: { __or: [BR_ID] } },
      })
      expect(payload).not.toHaveProperty('filter', expect.anything())
    })

    it('runs in the timezone of the schedule', () => {
      const payload = toBackupJobPayload(createFormDataSet({ source: MIRROR_SOURCE }))

      expect(payload.settings['']).toMatchObject({ timezone: 'Europe/Paris' })
    })

    it('distributes the backups', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({ source: MIRROR_SOURCE, backupRepository: { backupDistribution: 'distribute' } })
      )

      expect(payload.settings['']).toMatchObject({ distributeBackups: true })
    })

    it('copies the backups of the manually selected VMs', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({ source: { ...MIRROR_SOURCE, scopeType: 'manual', vmIds: [VM_ID] } })
      )

      expect(payload).toMatchObject({ filter: { vm: { uuid: { __or: [VM_ID] } } } })
    })

    it('copies the backups of the VMs matching the dynamic selection query', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({ source: { ...MIRROR_SOURCE, scopeType: 'smart', vmFilter: 'tags:prod' } })
      )

      expect(payload).toMatchObject({ filter: 'tags:prod' })
    })
  })

  describe('metadata backup', () => {
    it('saves the XO config and the metadata of every pool', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({
          source: { dataSource: 'metadata', saveXoConfig: true },
          backupRepository: { targetProxy: PROXY_ID },
        })
      )

      expect(payload).toEqual({
        type: 'metadataBackup',
        name: 'Daily backup',
        proxy: PROXY_ID,
        xoMetadata: true,
        pools: { id: { __or: [POOL_ID] } },
        remotes: { id: { __or: [BR_ID] } },
        schedules: { schedule: { cron: '0 0 * * *', timezone: 'Europe/Paris', enabled: true } },
        settings: {
          '': { reportWhen: 'failure' },
          schedule: { retentionXoMetadata: 3, retentionPoolMetadata: 3 },
        },
      })
    })

    it('saves the metadata of the manually selected pools', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({ source: { dataSource: 'metadata', scopeType: 'manual', poolIds: [POOL_ID] } })
      )

      expect(payload).toMatchObject({ pools: { id: { __or: [POOL_ID] } } })
    })

    it('saves the XO config only', () => {
      const payload = toBackupJobPayload(
        createFormDataSet({ source: { dataSource: 'metadata', saveXoConfig: true, savePoolsMetadata: false } })
      )

      expect(payload).not.toHaveProperty('pools', expect.anything())
      expect(payload.settings.schedule).toEqual({ retentionXoMetadata: 3 })
    })
  })
})

describe('toRunExpression', () => {
  const MONDAY = 1
  const TUESDAY = 2

  function matchesRun(expression: string, run: { dayOfMonth: number; dayOfWeek: number; hour: number }) {
    return parse(expression).createPredicate()({ run })
  }

  it('matches any of the selected days, at one of the selected hours', () => {
    const expression = toRunExpression([1], [MONDAY], [2])

    expect(matchesRun(expression, { dayOfMonth: 10, dayOfWeek: MONDAY, hour: 2 })).toBe(true)
    expect(matchesRun(expression, { dayOfMonth: 1, dayOfWeek: TUESDAY, hour: 2 })).toBe(true)
    expect(matchesRun(expression, { dayOfMonth: 10, dayOfWeek: TUESDAY, hour: 2 })).toBe(false)
    expect(matchesRun(expression, { dayOfMonth: 10, dayOfWeek: MONDAY, hour: 4 })).toBe(false)
  })
})
