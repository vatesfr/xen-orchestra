/* eslint-env jest */

import config from '../_config'
import randomId from '../_randomId'
import xo from '../_xoConnection'
import { getDefaultSchedule } from '../_defaultValues'

describe('metadataBackup', () => {
  test('execute three times a backup job', async () => {
    const { id: remoteId } = await xo.createTempRemote(config.remotes.default)

    // backup creation
    const retention = 2
    const defaultSchedule = getDefaultSchedule()
    const defaultSetting = {
      retentionPoolMetadata: retention,
      retentionXoMetadata: retention,
    }
    const scheduleTempId = randomId()
    const poolId = config.pools.default
    const backupInput = {
      pools: {
        id: poolId,
      },
      remotes: {
        id: remoteId,
      },
      schedules: {
        [scheduleTempId]: defaultSchedule,
      },
      settings: {
        [scheduleTempId]: defaultSetting,
      },
      xoMetadata: true,
    }
    const backup = await xo.createTempMetadataBackup(backupInput)

    // backup validation
    const schedule = await xo.getSchedule({ jobId: backup.id })
    expect(schedule).toEqual({
      ...defaultSchedule,
      enabled: false,
      id: expect.any(String),
      jobId: backup.id,
    })
    expect(backup).toEqual({
      id: expect.any(String),
      name: backupInput.name,
      pools: backupInput.pools,
      remotes: backupInput.remotes,
      settings: {
        '': backupInput.settings[''],
        [schedule.id]: defaultSetting,
      },
      type: 'metadataBackup',
      userId: xo._user.id,
      xoMetadata: backupInput.xoMetadata,
    })

    // backup execution
    const backups = await xo.runMetadataBackupJob(backup.id, schedule.id, {
      remotes: [remoteId],
      nExecutions: 3,
    })

    // remote validation
    const xoBackups = backups.xo[remoteId]
    expect(xoBackups.length).toBe(2)
    expect(xoBackups[0]).toEqual({
      id: expect.any(String),
      jobId: backup.id,
      jobName: backup.name,
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      timestamp: expect.any(Number),
    })

    const poolBackups = backups.pool[remoteId][poolId]
    expect(poolBackups.length).toBe(2)
    expect(poolBackups[0]).toEqual({
      id: expect.any(String),
      jobId: backup.id,
      jobName: backup.name,
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      timestamp: expect.any(Number),
      pool: expect.any(Object),
      poolMaster: expect.any(Object),
    })
    expect(poolBackups[0].pool.uuid).toBe(poolId)

    // logs validation
    const backupLogs = await xo.getBackupLogs({
      jobId: backup.id,
      scheduleId: schedule.id,
    })
    expect(backupLogs.length).toBe(3)

    const { tasks, ...log } = backupLogs[0]
    expect(log).toEqual({
      data: {
        reportWhen: backup.settings[''].reportWhen,
      },
      end: expect.any(Number),
      id: expect.any(String),
      jobId: backup.id,
      jobName: backup.name,
      message: 'backup',
      scheduleId: schedule.id,
      start: expect.any(Number),
      status: 'success',
    })

    expect(tasks.length).toBe(2)
    let containsXoTask, containsPoolTask
    tasks.forEach(({ tasks, ...xoOrPoolTask }) => {
      if (xoOrPoolTask.data.type === 'xo') {
        containsXoTask = true
        expect(xoOrPoolTask).toEqual({
          data: {
            type: 'xo',
          },
          end: expect.any(Number),
          id: expect.any(String),
          message: expect.any(String),
          start: expect.any(Number),
          status: 'success',
        })
      } else {
        containsPoolTask = true
        expect(xoOrPoolTask).toEqual({
          data: {
            id: poolId,
            pool: expect.any(Object),
            poolMaster: expect.any(Object),
            type: 'pool',
          },
          end: expect.any(Number),
          id: expect.any(String),
          message: expect.any(String),
          start: expect.any(Number),
          status: 'success',
        })
      }
      expect(tasks.length).toBe(1)
      expect(tasks[0]).toEqual({
        data: {
          id: remoteId,
          type: 'remote',
        },
        end: expect.any(Number),
        id: expect.any(String),
        message: expect.any(String),
        start: expect.any(Number),
        status: 'success',
      })
    })

    expect(containsXoTask).toBe(true)
    expect(containsPoolTask).toBe(true)
  }, 12e4)
})
