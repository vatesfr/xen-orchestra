import type {
  FrontAnyXoBackupJob,
  FrontXoMetadataBackupJob,
  FrontXoMirrorBackupJob,
  FrontXoVmBackupJob,
} from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { getBackupJobFormInitialData } from '@/modules/backup-job/utils/backup-job-form-initial-data.util.ts'
import { toLongTermRetentionKeepSettings } from '@/modules/backup-job/utils/backup-job-long-term-retention.util.ts'
import { toBackupJobPayload } from '@/modules/backup-job/utils/backup-job-payload.util.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { createMetadataBackupJob, createMirrorBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import { createSchedule } from '@/test/create-schedule.ts'

const SCHEDULE_ID = 'schedule-1' as FrontXoSchedule['id']

const SCHEDULE = createSchedule({ id: SCHEDULE_ID, name: 'Nightly', cron: '30 2 * * 1', timezone: 'Europe/Paris' })

type VmSettings = FrontXoVmBackupJob['settings']
type MirrorSettings = FrontXoMirrorBackupJob['settings']
type MetadataSettings = FrontXoMetadataBackupJob['settings']

function createVmJob(overrides: Partial<FrontXoVmBackupJob> = {}, scheduleSettings: Record<string, unknown> = {}) {
  const { settings, ...rest } = overrides

  return createVmBackupJob({
    name: 'Daily backup',
    mode: 'delta',
    ...rest,
    settings: { '': {}, ...settings, [SCHEDULE_ID]: scheduleSettings } as VmSettings,
  })
}

function createVmJobWithGeneralSettings(general: VmSettings[''], scheduleSettings: Record<string, unknown> = {}) {
  return createVmJob({ settings: { '': general } as VmSettings }, scheduleSettings)
}

function createMirrorJob(
  overrides: Partial<FrontXoMirrorBackupJob> = {},
  scheduleSettings: Record<string, unknown> = {}
) {
  return createMirrorBackupJob({
    ...overrides,
    settings: { '': { reportWhen: 'failure' }, [SCHEDULE_ID]: scheduleSettings } as MirrorSettings,
  })
}

function createMetadataJob(
  overrides: Partial<FrontXoMetadataBackupJob> = {},
  scheduleSettings: Record<string, unknown> = {}
) {
  return createMetadataBackupJob({
    ...overrides,
    settings: { '': {}, [SCHEDULE_ID]: scheduleSettings } as MetadataSettings,
  })
}

function getData(backupJob: FrontAnyXoBackupJob, schedule: FrontXoSchedule = SCHEDULE) {
  return getBackupJobFormInitialData(backupJob, schedule)
}

describe('getBackupJobFormInitialData', () => {
  describe('common to every job', () => {
    it('takes the name of the job and the state of the schedule', () => {
      expect(getData(createVmJob()).source).toMatchObject({ name: 'Daily backup', enabled: true })
      expect(getData(createVmJob(), createSchedule({ id: SCHEDULE_ID, enabled: false })).source.enabled).toBe(false)
    })

    it('has an empty name for a job without name', () => {
      expect(getData(createVmJob({ name: undefined })).source.name).toBe('')
    })

    it('takes the cron and the timezone of the schedule', () => {
      expect(getData(createVmJob()).planning).toMatchObject({ cron: '30 2 * * 1', timezone: 'Europe/Paris' })
    })

    it('falls back on the timezone of the job when the schedule has none', () => {
      const backupJob = createVmJobWithGeneralSettings({ timezone: 'America/New_York' })

      expect(getData(backupJob, createSchedule({ id: SCHEDULE_ID, timezone: undefined })).planning.timezone).toBe(
        'America/New_York'
      )
    })

    it('converts the timeout to hours', () => {
      expect(getData(createVmJobWithGeneralSettings({ timeout: 2 * 3600e3 })).planning.timeout).toBe(2)
    })

    it('has no timeout by default', () => {
      expect(getData(createVmJob()).planning.timeout).toBeUndefined()
    })

    it('takes the retries, the report condition, the recipients and the hidden successes', () => {
      const backupJob = createVmJobWithGeneralSettings({
        nRetriesVmBackupFailures: 3,
        reportWhen: 'always',
        reportRecipients: ['admin@example.com'],
        hideSuccessfulItems: true,
      })

      expect(getData(backupJob).planning).toMatchObject({
        nRetriesVmBackupFailures: 3,
        reportWhen: 'always',
        reportRecipients: ['admin@example.com'],
        hideSuccessfulItems: true,
      })
    })

    it('reports on failure, to nobody, by default', () => {
      expect(getData(createVmJob()).planning).toMatchObject({
        reportWhen: 'failure',
        reportRecipients: [],
        hideSuccessfulItems: false,
      })
    })
  })

  describe('VM backup', () => {
    it('takes the data source and the mode of the job', () => {
      expect(getData(createVmJob({ mode: 'full' })).source).toMatchObject({ dataSource: 'vm', mode: 'full' })
    })

    describe('VMs', () => {
      it('targets every VM', () => {
        expect(getData(createVmJob({ vms: {} })).source).toMatchObject({ scopeType: 'all', vmIds: [], vmFilter: '' })
      })

      it('targets the selected VMs', () => {
        const backupJob = createVmJob({ vms: { id: { __or: ['vm-1', 'vm-2'] } } as FrontXoVmBackupJob['vms'] })

        expect(getData(backupJob).source).toMatchObject({ scopeType: 'manual', vmIds: ['vm-1', 'vm-2'] })
      })

      it('targets the VM of a single id', () => {
        expect(getData(createVmJob({ vms: { id: 'vm-1' } as FrontXoVmBackupJob['vms'] })).source).toMatchObject({
          scopeType: 'manual',
          vmIds: ['vm-1'],
        })
      })

      it('targets the VMs matching the dynamic selection query, without its context', () => {
        expect(
          getData(createVmJob({ vms: 'vm:(tags:prod)' as unknown as FrontXoVmBackupJob['vms'] })).source
        ).toMatchObject({
          scopeType: 'smart',
          vmFilter: 'tags:prod',
        })
      })
    })

    describe('storage targets', () => {
      it('stores on backup repositories only', () => {
        expect(getData(createVmJob({ srs: undefined })).target.storageTargets).toEqual(['backup-repository'])
      })

      it('replicates on storage repositories only', () => {
        expect(getData(createVmJob({ remotes: undefined, srs: '*' })).target.storageTargets).toEqual([
          'storage-repository',
        ])
      })

      it('stores and replicates', () => {
        expect(getData(createVmJob({ srs: '*' })).target.storageTargets).toEqual([
          'backup-repository',
          'storage-repository',
        ])
      })
    })

    describe('backup repositories', () => {
      it('targets every backup repository', () => {
        expect(getData(createVmJob({ remotes: '*' })).target.backupRepository).toMatchObject({
          backupRepositoryScopeType: 'all',
          backupRepositoryIds: [],
          backupRepositoryFilter: '',
        })
      })

      it('targets the selected backup repositories', () => {
        const backupJob = createVmJob({ remotes: { id: { __or: ['br-1', 'br-2'] } } as FrontXoVmBackupJob['remotes'] })

        expect(getData(backupJob).target.backupRepository).toMatchObject({
          backupRepositoryScopeType: 'manual',
          backupRepositoryIds: ['br-1', 'br-2'],
        })
      })

      it('targets the backup repositories matching the dynamic selection query', () => {
        expect(getData(createVmJob({ remotes: 'backupRepository:(name:nfs)' })).target.backupRepository).toMatchObject({
          backupRepositoryScopeType: 'smart',
          backupRepositoryFilter: 'name:nfs',
        })
      })

      it('goes through the proxy of the job', () => {
        const backupJob = createVmJob({ proxy: 'proxy-1' as FrontXoVmBackupJob['proxy'] })

        expect(getData(backupJob).target.backupRepository.targetProxy).toBe('proxy-1')
      })

      it('distributes the backups', () => {
        expect(
          getData(createVmJobWithGeneralSettings({ distributeBackups: true })).target.backupRepository
        ).toMatchObject({ backupDistribution: 'distribute' })
        expect(getData(createVmJob()).target.backupRepository.backupDistribution).toBe('every')
      })

      it('merges the backups synchronously', () => {
        expect(
          getData(createVmJobWithGeneralSettings({ mergeBackupsSynchronously: true })).target.backupRepository
            .mergeBackupsSynchronously
        ).toBe(true)
        expect(getData(createVmJob()).target.backupRepository.mergeBackupsSynchronously).toBe(false)
      })
    })

    describe('storage repositories', () => {
      it('targets every storage repository', () => {
        expect(getData(createVmJob({ srs: '*' })).target.storageRepository).toMatchObject({
          storageRepositoryScopeType: 'all',
          storageRepositoryIds: [],
        })
      })

      it('targets the selected storage repositories', () => {
        const backupJob = createVmJob({ srs: { id: { __or: ['sr-1'] } } as FrontXoVmBackupJob['srs'] })

        expect(getData(backupJob).target.storageRepository).toMatchObject({
          storageRepositoryScopeType: 'manual',
          storageRepositoryIds: ['sr-1'],
        })
      })

      it('targets the storage repositories matching the dynamic selection query', () => {
        expect(getData(createVmJob({ srs: 'sr:(name_label:nfs)' })).target.storageRepository).toMatchObject({
          storageRepositoryScopeType: 'smart',
          storageRepositoryFilter: 'name_label:nfs',
        })
      })

      it('distributes the replicas', () => {
        expect(
          getData(createVmJobWithGeneralSettings({ distributeReplications: true }, {})).target.storageRepository
            .replicaDistribution
        ).toBe('distribute')
        expect(getData(createVmJob()).target.storageRepository.replicaDistribution).toBe('every')
      })
    })

    describe('retentions', () => {
      it('reads the retentions of the schedule under its id', () => {
        const backupJob = createVmJob({}, { exportRetention: 5, copyRetention: 2, snapshotRetention: 3 })

        expect(getData(backupJob).target.backupRepository.exportRetention).toBe(5)
        expect(getData(backupJob).target.storageRepository.copyRetention).toBe(2)
        expect(getData(backupJob).transfer.snapshotRetention).toBe(3)
      })

      it('ignores the retentions of another schedule', () => {
        const backupJob = createVmJob({
          settings: { 'schedule-other': { exportRetention: 9 } } as unknown as VmSettings,
        })

        expect(getData(backupJob).target.backupRepository.exportRetention).toBeUndefined()
      })

      it('keeps no snapshot when the schedule has no snapshot retention', () => {
        expect(getData(createVmJob()).transfer.snapshotRetention).toBe(0)
      })

      it('reads the long term retentions and the backup each period starts on', () => {
        const backupJob = createVmJobWithGeneralSettings({
          longTermRetention: {
            daily: { retention: 7, settings: { firstHourOfTheDay: 7 } },
            weekly: { retention: 4, settings: { firstDayOfWeek: 1 } },
            monthly: { retention: 12, settings: { firstDayOfMonth: 4 } },
            yearly: { retention: 2, settings: { firstDayOfYear: 59 } },
          },
        })

        expect(getData(backupJob).target.backupRepository).toMatchObject({
          ltrDailyRetention: 7,
          ltrDailyKeep: 7,
          ltrWeeklyRetention: 4,
          ltrWeeklyKeep: 1,
          ltrMonthlyRetention: 12,
          ltrMonthlyKeep: 5,
          ltrYearlyRetention: 2,
          ltrYearlyKeep: 2,
        })
      })

      it('reads back what toLongTermRetentionKeepSettings wrote', () => {
        const longTermRetention = {
          daily: { retention: 1, settings: toLongTermRetentionKeepSettings('daily', 6) },
          weekly: { retention: 1, settings: toLongTermRetentionKeepSettings('weekly', 3) },
          monthly: { retention: 1, settings: toLongTermRetentionKeepSettings('monthly', 15) },
          yearly: { retention: 1, settings: toLongTermRetentionKeepSettings('yearly', 8) },
        }

        expect(getData(createVmJobWithGeneralSettings({ longTermRetention })).target.backupRepository).toMatchObject({
          ltrDailyKeep: 6,
          ltrWeeklyKeep: 3,
          ltrMonthlyKeep: 15,
          ltrYearlyKeep: 8,
        })
      })

      it('has no long term retention by default', () => {
        expect(getData(createVmJob()).target.backupRepository).toMatchObject({
          ltrDailyRetention: 0,
          ltrDailyKeep: undefined,
          ltrWeeklyRetention: 0,
          ltrMonthlyRetention: 0,
          ltrYearlyRetention: 0,
        })
      })

      it('has no backup to keep for a period without start', () => {
        const backupJob = createVmJobWithGeneralSettings({
          longTermRetention: { daily: { retention: 7, settings: {} } },
        })

        expect(getData(backupJob).target.backupRepository).toMatchObject({
          ltrDailyRetention: 7,
          ltrDailyKeep: undefined,
        })
      })
    })

    describe('key backup', () => {
      it('never makes a key backup', () => {
        expect(getData(createVmJob()).transfer).toMatchObject({ keyBackup: 'never' })
      })

      it('makes a key backup on every run', () => {
        expect(getData(createVmJob({}, { fullInterval: 1 })).transfer).toMatchObject({ keyBackup: 'always' })
      })

      it('makes a key backup on the selected days and hours', () => {
        const backupJob = createVmJob({}, { fullInterval: 'run:(|(dayOfMonth:1 dayOfWeek:1) hour:2)' })

        expect(getData(backupJob).transfer).toMatchObject({
          keyBackup: 'dynamic',
          keyBackupMonthDays: [1],
          keyBackupWeekDays: [1],
          keyBackupHours: [2],
        })
      })

      it('makes a key backup on several hours', () => {
        const backupJob = createVmJob({}, { fullInterval: 'run:(dayOfWeek:1 |(hour:2 hour:14))' })

        expect(getData(backupJob).transfer).toMatchObject({ keyBackupWeekDays: [1], keyBackupHours: [2, 14] })
      })

      it('makes no key backup of a full backup', () => {
        expect(getData(createVmJob({ mode: 'full' }, { fullInterval: 1 })).transfer.keyBackup).toBe('never')
      })
    })

    describe('health check', () => {
      it('is disabled by default', () => {
        expect(getData(createVmJob()).target.healthCheck).toMatchObject({
          healthCheckEnabled: false,
          healthCheckSr: undefined,
          healthCheckVmTags: [],
        })
      })

      it('checks the VMs with the tags on the storage repository', () => {
        const backupJob = createVmJobWithGeneralSettings({ healthCheckTimeout: '25m' } as VmSettings[''], {
          healthCheckSr: 'sr-1',
          healthCheckVmsWithTags: ['prod', 'team/a'],
        })

        expect(getData(backupJob).target.healthCheck).toMatchObject({
          healthCheckEnabled: true,
          healthCheckSr: 'sr-1',
          healthCheckTimeout: 25,
          healthCheckSchedule: 'always',
          healthCheckVmTags: ['prod', 'team/a'],
        })
      })

      it('keeps the default timeout without valid timeout', () => {
        const backupJob = createVmJob({}, { healthCheckSr: 'sr-1', healthCheckVmsWithTags: [] })

        expect(getData(backupJob).target.healthCheck).toMatchObject({
          healthCheckEnabled: true,
          healthCheckTimeout: 10,
        })
      })

      it('checks the VMs on the selected days and hours', () => {
        const backupJob = createVmJob({}, { healthCheckSr: 'sr-1', healthCheckVmsWithTags: 'run:(dayOfWeek:1 hour:2)' })

        expect(getData(backupJob).target.healthCheck).toMatchObject({
          healthCheckEnabled: true,
          healthCheckSchedule: 'dynamic',
          healthCheckVmTags: [],
          healthCheckWeekDays: [1],
          healthCheckHours: [2],
        })
      })

      it('checks the VMs with one of the tags on the selected days and hours', () => {
        const backupJob = createVmJob(
          {},
          {
            healthCheckSr: 'sr-1',
            healthCheckVmsWithTags: 'vm:tags:|(/^prod$/ /^team\\/a$/) run:(dayOfWeek:1 hour:2)',
          }
        )

        expect(getData(backupJob).target.healthCheck).toMatchObject({
          healthCheckSchedule: 'dynamic',
          healthCheckVmTags: ['prod', 'team/a'],
          healthCheckWeekDays: [1],
          healthCheckHours: [2],
        })
      })
    })

    describe('transfer', () => {
      it('takes the concurrency', () => {
        expect(getData(createVmJobWithGeneralSettings({ concurrency: 4 })).transfer.concurrency).toBe(4)
      })

      it('converts the speed limit to MiB', () => {
        expect(getData(createVmJobWithGeneralSettings({ maxExportRate: 10 * 1024 ** 2 })).transfer.maxExportRate).toBe(
          10
        )
        expect(getData(createVmJob()).transfer.maxExportRate).toBeUndefined()
      })

      it('takes the compression', () => {
        expect(getData(createVmJob({ mode: 'full', compression: 'zstd' })).transfer.compression).toBe('zstd')
      })

      it('takes the NBD settings of an incremental backup', () => {
        expect(getData(createVmJobWithGeneralSettings({ preferNbd: true, nbdConcurrency: 3 })).transfer).toMatchObject({
          preferNbd: true,
          nbdConcurrency: 3,
        })
        expect(getData(createVmJob()).transfer.preferNbd).toBe(false)
      })

      it('takes the offline backup', () => {
        expect(getData(createVmJobWithGeneralSettings({ offlineBackup: true })).transfer.offlineBackup).toBe(true)
        expect(getData(createVmJob()).transfer.offlineBackup).toBe(false)
      })

      it.each([
        ['default', {}],
        ['with-memory', { checkpointSnapshot: true }],
        ['offline', { offlineSnapshot: true }],
      ])('reads the %s snapshot mode', (snapshotMode, general) => {
        expect(getData(createVmJobWithGeneralSettings(general)).transfer.snapshotMode).toBe(snapshotMode)
      })

      it('does not synchronise the snapshots', () => {
        expect(getData(createVmJob()).transfer).toMatchObject({ snapshotSync: 'none', snapshotSyncTag: undefined })
      })

      it('synchronises the snapshots of every VM', () => {
        expect(
          getData(createVmJobWithGeneralSettings({ synchronizedSnapshot: true } as VmSettings[''])).transfer
        ).toMatchObject({
          snapshotSync: 'all',
          snapshotSyncTag: undefined,
        })
      })

      it('synchronises the snapshots of the VMs with a tag', () => {
        expect(
          getData(createVmJobWithGeneralSettings({ synchronizedSnapshot: 'prod' } as VmSettings[''])).transfer
        ).toMatchObject({
          snapshotSync: 'smart',
          snapshotSyncTag: 'prod',
        })
      })
    })
  })

  describe('mirror backup', () => {
    it('takes the data source, the mode, the proxy and the source backup repository', () => {
      const backupJob = createMirrorJob({
        mode: 'full',
        proxy: 'proxy-source' as FrontXoMirrorBackupJob['proxy'],
        sourceRemote: 'br-source' as FrontXoMirrorBackupJob['sourceRemote'],
      })

      expect(getData(backupJob).source).toMatchObject({
        dataSource: 'mirror',
        mode: 'full',
        proxy: 'proxy-source',
        sourceBackupRepository: 'br-source',
      })
    })

    it('copies every VM backup', () => {
      expect(getData(createMirrorJob()).source).toMatchObject({ scopeType: 'all', vmIds: [], vmFilter: '' })
    })

    it('copies the backups of the manually selected VMs', () => {
      const backupJob = createMirrorJob({
        filter: { vm: { uuid: { __or: ['vm-1', 'vm-2'] } } } as FrontXoMirrorBackupJob['filter'],
      })

      expect(getData(backupJob).source).toMatchObject({ scopeType: 'manual', vmIds: ['vm-1', 'vm-2'] })
    })

    it('copies the backups of the VMs matching the dynamic selection query, without its context', () => {
      const backupJob = createMirrorJob({}, { vmFilter: 'vm:(tags:prod)' })

      expect(getData(backupJob).source).toMatchObject({ scopeType: 'smart', vmFilter: 'tags:prod' })
    })

    it('takes the target backup repositories and their retention', () => {
      const backupJob = createMirrorJob(
        { remotes: { id: { __or: ['br-1'] } } as FrontXoMirrorBackupJob['remotes'] },
        { exportRetention: 4 }
      )

      expect(getData(backupJob).target.backupRepository).toMatchObject({
        backupRepositoryScopeType: 'manual',
        backupRepositoryIds: ['br-1'],
        exportRetention: 4,
      })
    })

    it('takes the transfer settings, without the VM backup ones', () => {
      const backupJob = createMirrorJob()
      backupJob.settings[''] = {
        concurrency: 3,
        maxExportRate: 2 * 1024 ** 2,
        offlineBackup: true,
      } as MirrorSettings['']

      expect(getData(backupJob).transfer).toMatchObject({ concurrency: 3, maxExportRate: 2, offlineBackup: false })
    })

    it('takes the health check', () => {
      const backupJob = createMirrorJob({}, { healthCheckSr: 'sr-1', healthCheckVmsWithTags: ['prod'] })

      expect(getData(backupJob).target.healthCheck).toMatchObject({
        healthCheckEnabled: true,
        healthCheckSr: 'sr-1',
        healthCheckVmTags: ['prod'],
      })
    })
  })

  describe('metadata backup', () => {
    it('saves the XO config and the metadata of every pool', () => {
      const backupJob = createMetadataJob({
        xoMetadata: true,
        pools: '*' as unknown as FrontXoMetadataBackupJob['pools'],
      })

      expect(getData(backupJob).source).toMatchObject({
        dataSource: 'metadata',
        saveXoConfig: true,
        savePoolsMetadata: true,
        scopeType: 'all',
      })
    })

    it('saves the metadata of the selected pools', () => {
      const backupJob = createMetadataJob({
        pools: { id: { __or: ['pool-1', 'pool-2'] } } as FrontXoMetadataBackupJob['pools'],
      })

      expect(getData(backupJob).source).toMatchObject({ scopeType: 'manual', poolIds: ['pool-1', 'pool-2'] })
    })

    it('saves the metadata of the pools matching the dynamic selection query', () => {
      const backupJob = createMetadataJob({ pools: 'pool:(tags:prod)' as unknown as FrontXoMetadataBackupJob['pools'] })

      expect(getData(backupJob).source).toMatchObject({ scopeType: 'smart', poolFilter: 'tags:prod' })
    })

    it('saves the XO config only', () => {
      const backupJob = createMetadataJob({ xoMetadata: true, pools: undefined })

      expect(getData(backupJob).source).toMatchObject({ saveXoConfig: true, savePoolsMetadata: false })
    })

    it('saves the pools metadata only', () => {
      const backupJob = createMetadataJob({ xoMetadata: undefined })

      expect(getData(backupJob).source).toMatchObject({ saveXoConfig: false, savePoolsMetadata: true })
    })

    it('takes the proxy and the retention of the XO config', () => {
      const backupJob = createMetadataJob(
        { proxy: 'proxy-1' as FrontXoMetadataBackupJob['proxy'] },
        { retentionXoMetadata: 5, retentionPoolMetadata: 7 }
      )

      expect(getData(backupJob).target.backupRepository).toMatchObject({ targetProxy: 'proxy-1', exportRetention: 5 })
    })

    it('takes the retention of the pools metadata without XO config retention', () => {
      const backupJob = createMetadataJob({}, { retentionPoolMetadata: 7 })

      expect(getData(backupJob).target.backupRepository.exportRetention).toBe(7)
    })

    it('takes the target backup repositories', () => {
      expect(getData(createMetadataJob()).target.backupRepository).toMatchObject({
        backupRepositoryScopeType: 'manual',
        backupRepositoryIds: ['br-123'],
      })
    })
  })

  describe('round trip with toBackupJobPayload', () => {
    it('rebuilds the payload of a VM backup', () => {
      const backupJob = createVmBackupJob({
        name: 'Daily backup',
        mode: 'delta',
        proxy: 'proxy-1' as FrontXoVmBackupJob['proxy'],
        vms: { id: { __or: ['vm-1', 'vm-2'] } } as FrontXoVmBackupJob['vms'],
        remotes: { id: { __or: ['br-1'] } } as FrontXoVmBackupJob['remotes'],
        srs: 'sr:(name_label:nfs)',
        settings: {
          '': {
            concurrency: 3,
            maxExportRate: 10 * 1024 ** 2,
            preferNbd: true,
            nbdConcurrency: 2,
            offlineSnapshot: true,
            synchronizedSnapshot: 'prod',
            distributeBackups: true,
            mergeBackupsSynchronously: true,
            longTermRetention: {
              daily: { retention: 7, settings: { firstHourOfTheDay: 7 } },
              monthly: { retention: 12, settings: { firstDayOfMonth: 4 } },
              yearly: { retention: 2, settings: { firstDayOfYear: 59 } },
            },
            timezone: 'Europe/Paris',
            timeout: 2 * 3600e3,
            nRetriesVmBackupFailures: 2,
            reportWhen: 'always',
            reportRecipients: ['admin@example.com'],
            hideSuccessfulItems: true,
            healthCheckTimeout: '15m',
          },
          [SCHEDULE_ID]: {
            exportRetention: 5,
            copyRetention: 2,
            snapshotRetention: 3,
            fullInterval: 'run:(|(dayOfMonth:1 dayOfWeek:1) hour:2)',
            healthCheckSr: 'sr-1',
            healthCheckVmsWithTags: 'vm:tags:|(/^prod$/ /^team\\/a$/) run:(dayOfWeek:1 hour:2)',
          },
        } as VmSettings,
      })

      const payload = toBackupJobPayload(getData(backupJob), SCHEDULE_ID)

      expect(payload).toMatchObject({
        type: 'backup',
        name: 'Daily backup',
        mode: 'delta',
        proxy: 'proxy-1',
        vms: backupJob.vms,
        remotes: backupJob.remotes,
        srs: backupJob.srs,
        schedules: { [SCHEDULE_ID]: { cron: SCHEDULE.cron, timezone: SCHEDULE.timezone, enabled: true } },
      })
      expect(payload.settings).toEqual(backupJob.settings)
    })

    it('rebuilds the payload of a disabled VM backup of every VM', () => {
      const backupJob = createVmJob(
        { mode: 'full', compression: 'zstd', vms: {}, remotes: '*' },
        { exportRetention: 2, snapshotRetention: 1 }
      )
      backupJob.settings[''] = { concurrency: 2, timezone: 'Europe/Paris', reportWhen: 'failure' }

      const payload = toBackupJobPayload(
        getData(backupJob, createSchedule({ id: SCHEDULE_ID, enabled: false, timezone: 'Europe/Paris' })),
        SCHEDULE_ID
      )

      expect(payload).toMatchObject({ mode: 'full', compression: 'zstd', vms: {}, remotes: '*' })
      expect(payload.schedules[SCHEDULE_ID].enabled).toBe(false)
      expect(payload.settings).toEqual(backupJob.settings)
    })

    it('rebuilds the payload of a mirror backup', () => {
      const backupJob = createMirrorJob(
        {
          proxy: 'proxy-source' as FrontXoMirrorBackupJob['proxy'],
          sourceRemote: 'br-source' as FrontXoMirrorBackupJob['sourceRemote'],
          remotes: { id: { __or: ['br-1'] } } as FrontXoMirrorBackupJob['remotes'],
        },
        { exportRetention: 4, vmFilter: 'vm:(tags:prod)' }
      )
      backupJob.settings[''] = { concurrency: 2, timezone: 'Europe/Paris', reportWhen: 'failure' }

      const payload = toBackupJobPayload(getData(backupJob), SCHEDULE_ID)

      expect(payload).toMatchObject({
        type: 'mirrorBackup',
        mode: 'delta',
        proxy: 'proxy-source',
        sourceRemote: 'br-source',
        remotes: backupJob.remotes,
      })
      expect(payload.settings).toEqual(backupJob.settings)
    })

    it('rebuilds the payload of a metadata backup', () => {
      const backupJob = createMetadataJob(
        {
          xoMetadata: true,
          proxy: 'proxy-1' as FrontXoMetadataBackupJob['proxy'],
          pools: { id: { __or: ['pool-1'] } } as FrontXoMetadataBackupJob['pools'],
          remotes: { id: { __or: ['br-1'] } } as FrontXoMetadataBackupJob['remotes'],
        },
        { retentionXoMetadata: 5, retentionPoolMetadata: 5 }
      )
      backupJob.settings[''] = { reportWhen: 'failure' }

      const payload = toBackupJobPayload(getData(backupJob), SCHEDULE_ID)

      expect(payload).toMatchObject({
        type: 'metadataBackup',
        proxy: 'proxy-1',
        xoMetadata: true,
        pools: backupJob.pools,
        remotes: backupJob.remotes,
      })
      expect(payload.settings).toEqual(backupJob.settings)
    })
  })
})
