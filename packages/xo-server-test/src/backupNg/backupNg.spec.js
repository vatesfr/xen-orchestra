/* eslint-env jest */

import { forOwn } from 'lodash'
import { noSuchObject } from 'xo-common/api-errors'

import config from '../_config'
import randomId from '../_randomId'
import xo from '../_xoConnection'

const DEFAULT_SCHEDULE = {
  name: 'scheduleTest',
  cron: '0 * * * * *',
}

export const getDefaultName = () => `xo-server-test ${new Date().toISOString()}`

const validateRootTask = (log, props, expected) => {
  expect(log).toMatchSnapshot({
    end: expect.any(Number),
    id: expect.any(String),
    jobId: expect.any(String),
    jobName: expect.any(String),
    scheduleId: expect.any(String),
    start: expect.any(Number),
    ...props,
  })
  expect(log).toMatchObject(expected)
}

const validateVmTask = (task, vmId, props) => {
  expect(task).toMatchSnapshot({
    data: {
      id: expect.any(String),
    },
    end: expect.any(Number),
    id: expect.any(String),
    message: expect.any(String),
    start: expect.any(Number),
    ...props,
  })
  expect(task.data.id).toBe(vmId)
}

const validateSnapshotTask = (task, props) =>
  expect(task).toMatchSnapshot({
    end: expect.any(Number),
    id: expect.any(String),
    result: expect.any(String),
    start: expect.any(Number),
    ...props,
  })

const validateExportTask = (task, srOrRemoteIds, props) => {
  expect(task).toMatchSnapshot({
    end: expect.any(Number),
    id: expect.any(String),
    message: expect.any(String),
    start: expect.any(Number),
    ...props,
  })
  expect(srOrRemoteIds).toContain(task.data.id)
}

const validateOperationTask = (task, props) => {
  expect(task).toMatchSnapshot({
    end: expect.any(Number),
    id: expect.any(String),
    message: expect.any(String),
    start: expect.any(Number),
    ...props,
  })
}

describe('backupNg', () => {
  describe('.createJob() :', () => {
    it('creates a new backup job without schedules', async () => {
      const name = getDefaultName()
      const vms = {
        id: config.vms.default,
      }
      const backupNg = await xo.createTempBackupNgJob({
        mode: 'full',
        name,
        vms,
      })

      expect(backupNg).toMatchSnapshot({
        id: expect.any(String),
        name: expect.any(String),
        userId: expect.any(String),
        vms: expect.any(Object),
      })
      expect(backupNg.name).toBe(name)
      expect(backupNg.vms).toEqual(vms)
      expect(backupNg.userId).toBe(xo._user.id)
    })

    it('creates a new backup job with schedules', async () => {
      const vms = {
        id: config.vms.default,
      }
      const name = getDefaultName()
      const scheduleTempId = randomId()
      const { id: jobId } = await xo.createTempBackupNgJob({
        mode: 'full',
        name,
        schedules: {
          [scheduleTempId]: DEFAULT_SCHEDULE,
        },
        settings: {
          [scheduleTempId]: { snapshotRetention: 1 },
        },
        vms,
      })

      const backupNgJob = await xo.call('backupNg.getJob', { id: jobId })

      expect(backupNgJob).toMatchSnapshot({
        id: expect.any(String),
        name: expect.any(String),
        settings: expect.any(Object),
        userId: expect.any(String),
        vms: expect.any(Object),
      })
      expect(backupNgJob.vms).toEqual(vms)
      expect(backupNgJob.name).toEqual(name)
      expect(backupNgJob.userId).toBe(xo._user.id)

      expect(Object.keys(backupNgJob.settings).length).toBe(2)
      const schedule = await xo.getSchedule({ jobId })
      expect(typeof schedule).toBe('object')
      expect(backupNgJob.settings[schedule.id]).toEqual({
        snapshotRetention: 1,
      })

      expect(schedule).toMatchSnapshot({
        id: expect.any(String),
        jobId: expect.any(String),
      })
    })
  })

  describe('.delete() :', () => {
    it('deletes a backup job', async () => {
      const scheduleTempId = randomId()
      const { id: jobId } = await xo.call('backupNg.createJob', {
        mode: 'full',
        name: getDefaultName(),
        vms: {
          id: config.vms.default,
        },
        schedules: {
          [scheduleTempId]: DEFAULT_SCHEDULE,
        },
        settings: {
          [scheduleTempId]: { snapshotRetention: 1 },
        },
      })

      const schedule = await xo.getSchedule({ jobId })
      expect(typeof schedule).toBe('object')

      await xo.call('backupNg.deleteJob', { id: jobId })

      let isRejectedJobErrorValid = false
      await xo.call('backupNg.getJob', { id: jobId }).catch(error => {
        isRejectedJobErrorValid = noSuchObject.is(error)
      })
      expect(isRejectedJobErrorValid).toBe(true)

      let isRejectedScheduleErrorValid = false
      await xo.call('schedule.get', { id: schedule.id }).catch(error => {
        isRejectedScheduleErrorValid = noSuchObject.is(error)
      })
      expect(isRejectedScheduleErrorValid).toBe(true)
    })
  })

  describe('.runJob() :', () => {
    it('fails trying to run a backup job without schedule', async () => {
      const { id } = await xo.createTempBackupNgJob({
        mode: 'full',
        name: getDefaultName(),
        vms: {
          id: config.vms.default,
        },
      })
      await expect(xo.call('backupNg.runJob', { id })).rejects.toMatchSnapshot()
    })

    it('fails trying to run a backup job with no matching VMs', async () => {
      const scheduleTempId = randomId()
      const { id: jobId } = await xo.createTempBackupNgJob({
        mode: 'full',
        name: getDefaultName(),
        schedules: {
          [scheduleTempId]: DEFAULT_SCHEDULE,
        },
        settings: {
          [scheduleTempId]: { snapshotRetention: 1 },
        },
        vms: {
          id: config.vms.default,
          name: 'test-vm-backupNg',
        },
      })

      const schedule = await xo.getSchedule({ jobId })
      expect(typeof schedule).toBe('object')

      await expect(
        xo.call('backupNg.runJob', { id: jobId, schedule: schedule.id })
      ).rejects.toMatchSnapshot()
    })

    it('fails trying to run a backup job with non-existent vm', async () => {
      jest.setTimeout(7e3)
      const scheduleTempId = randomId()
      const { id: jobId } = await xo.createTempBackupNgJob({
        mode: 'full',
        name: getDefaultName(),
        schedules: {
          [scheduleTempId]: DEFAULT_SCHEDULE,
        },
        settings: {
          [scheduleTempId]: { snapshotRetention: 1 },
        },
        vms: {
          id: 'non-existent-id',
        },
      })

      const schedule = await xo.getSchedule({ jobId })
      expect(typeof schedule).toBe('object')

      await xo.call('backupNg.runJob', { id: jobId, schedule: schedule.id })
      const [log] = await xo.getBackupLogs({
        scheduleId: schedule.id,
      })
      expect(log.warnings).toMatchSnapshot()
    })

    it('fails trying to run a backup job with a VM without disks', async () => {
      jest.setTimeout(8e3)
      await xo.createTempServer(config.servers.default)
      const { id: vmIdWithoutDisks } = await xo.createTempVm({
        name_description: 'Creating a vm without disks',
        name_label: getDefaultName(),
        template: config.templates.templateWithoutDisks,
      })

      const scheduleTempId = randomId()
      const jobName = getDefaultName()
      const mode = 'full'
      const { id: jobId } = await xo.createTempBackupNgJob({
        mode,
        name: jobName,
        schedules: {
          [scheduleTempId]: DEFAULT_SCHEDULE,
        },
        settings: {
          [scheduleTempId]: { snapshotRetention: 1 },
        },
        vms: {
          id: vmIdWithoutDisks,
        },
      })

      const schedule = await xo.getSchedule({ jobId })
      expect(typeof schedule).toBe('object')
      await xo.call('backupNg.runJob', { id: jobId, schedule: schedule.id })

      const [
        {
          tasks: [vmTask],
          ...log
        },
      ] = await xo.getBackupLogs({
        jobId,
        scheduleId: schedule.id,
      })

      validateRootTask(
        log,
        {
          data: {
            mode,
            reportWhen: 'never',
          },
          message: 'backup',
          status: 'skipped',
        },
        { jobName }
      )

      expect(vmTask).toMatchSnapshot({
        end: expect.any(Number),
        data: {
          id: expect.any(String),
        },
        id: expect.any(String),
        message: expect.any(String),
        result: {
          stack: expect.any(String),
        },
        start: expect.any(Number),
      })

      expect(vmTask.data.id).toBe(vmIdWithoutDisks)
    })

    it('fails trying to run backup job without retentions', async () => {
      jest.setTimeout(7e3)
      const scheduleTempId = randomId()
      await xo.createTempServer(config.servers.default)
      const { id: remoteId } = await xo.createTempRemote(config.remotes.default)
      const jobName = getDefaultName()
      const mode = 'full'
      const { id: jobId } = await xo.createTempBackupNgJob({
        mode,
        name: jobName,
        remotes: {
          id: remoteId,
        },
        schedules: {
          [scheduleTempId]: DEFAULT_SCHEDULE,
        },
        settings: {
          [scheduleTempId]: {},
        },
        srs: {
          id: config.srs.default,
        },
        vms: {
          id: config.vms.default,
        },
      })

      const schedule = await xo.getSchedule({ jobId })
      expect(typeof schedule).toBe('object')
      await xo.call('backupNg.runJob', { id: jobId, schedule: schedule.id })

      const [
        {
          tasks: [task],
          ...log
        },
      ] = await xo.getBackupLogs({
        jobId,
        scheduleId: schedule.id,
      })

      validateRootTask(
        log,
        {
          data: {
            mode,
            reportWhen: 'never',
          },
          message: 'backup',
          status: 'failure',
        },
        { jobName }
      )

      expect(task).toMatchSnapshot({
        data: {
          id: expect.any(String),
        },
        end: expect.any(Number),
        id: expect.any(String),
        message: expect.any(String),
        result: {
          stack: expect.any(String),
        },
        start: expect.any(Number),
      })
      expect(task.data.id).toBe(config.vms.default)
    })
  })

  test('execute three times a rolling snapshot with 2 as retention & revert to an old state', async () => {
    jest.setTimeout(6e4)
    await xo.createTempServer(config.servers.default)
    let vm = await xo.createTempVm({
      name_label: getDefaultName(),
      name_description: 'Creating a temporary vm',
      template: config.templates.default,
      VDIs: [
        {
          size: 1,
          SR: config.srs.default,
          type: 'user',
        },
      ],
    })

    const scheduleTempId = randomId()
    const jobName = getDefaultName()
    const mode = 'full'
    const { id: jobId } = await xo.createTempBackupNgJob({
      mode,
      name: jobName,
      vms: {
        id: vm.id,
      },
      schedules: {
        [scheduleTempId]: DEFAULT_SCHEDULE,
      },
      settings: {
        [scheduleTempId]: { snapshotRetention: 2 },
      },
    })

    const schedule = await xo.getSchedule({ jobId })
    expect(typeof schedule).toBe('object')

    for (let i = 0; i < 3; i++) {
      await xo.call('backupNg.runJob', { id: jobId, schedule: schedule.id })
      vm = await xo.waitObjectState(vm.id, ({ snapshots }) => {
        // Test on updating snapshots.
        expect(snapshots).not.toEqual(vm.snapshots)
      })
    }

    // Test on the retention, how many snapshots should be saved.
    expect(vm.snapshots.length).toBe(2)

    const newVideoram = 16
    await xo.call('vm.set', { id: vm.id, videoram: newVideoram })
    await xo.waitObjectState(vm.id, ({ videoram }) => {
      expect(videoram).toBe(newVideoram.toString())
    })

    await xo.call('vm.revert', {
      snapshot: vm.snapshots[0],
    })

    await xo.waitObjectState(vm.id, ({ videoram }) => {
      expect(videoram).toBe(vm.videoram)
    })

    const [
      {
        tasks: [{ tasks: subTasks, ...vmTask }],
        ...log
      },
    ] = await xo.getBackupLogs({
      jobId,
      scheduleId: schedule.id,
    })

    validateRootTask(
      log,
      {
        data: {
          mode,
          reportWhen: 'never',
        },
        message: 'backup',
        status: 'success',
      },
      { jobName }
    )

    const subTaskSnapshot = subTasks.find(
      ({ message }) => message === 'snapshot'
    )
    expect(subTaskSnapshot).toMatchSnapshot({
      end: expect.any(Number),
      id: expect.any(String),
      result: expect.any(String),
      start: expect.any(Number),
    })

    expect(vmTask).toMatchSnapshot({
      data: {
        id: expect.any(String),
      },
      end: expect.any(Number),
      id: expect.any(String),
      message: expect.any(String),
      start: expect.any(Number),
    })
    expect(vmTask.data.id).toBe(vm.id)
  })

  test('execute three times a delta backup with 2 remotes, 2 as retention and 2 as fullInterval', async () => {
    jest.setTimeout(12e5)
    const {
      vms: { default: defaultVm, vmToBackup = defaultVm },
      remotes: { default: defaultRemote, remote1, remote2 = defaultRemote },
      servers: { default: defaultServer },
    } = config

    expect(vmToBackup).not.toBe(undefined)
    expect(remote1).not.toBe(undefined)
    expect(remote2).not.toBe(undefined)

    await xo.createTempServer(defaultServer)
    const { id: remoteId1 } = await xo.createTempRemote(remote1)
    const { id: remoteId2 } = await xo.createTempRemote(remote2)
    const remotes = [remoteId1, remoteId2]

    const exportRetention = 2
    const fullInterval = 2
    const scheduleTempId = randomId()
    const jobName = getDefaultName()
    const mode = 'delta'
    const { id: jobId } = await xo.createTempBackupNgJob({
      mode,
      name: jobName,
      remotes: {
        id: {
          __or: remotes,
        },
      },
      schedules: {
        [scheduleTempId]: DEFAULT_SCHEDULE,
      },
      settings: {
        '': {
          fullInterval,
        },
        [remoteId1]: { deleteFirst: true },
        [scheduleTempId]: { exportRetention },
      },
      vms: {
        id: vmToBackup,
      },
    })

    const schedule = await xo.getSchedule({ jobId })
    expect(typeof schedule).toBe('object')

    const nExecutions = 3
    const backupsByRemote = await xo.runBackupJob(jobId, schedule.id, {
      remotes,
      nExecutions,
    })
    forOwn(backupsByRemote, backups =>
      expect(backups.length).toBe(exportRetention)
    )

    const backupLogs = await xo.getBackupLogs({
      jobId,
      scheduleId: schedule.id,
    })
    expect(backupLogs.length).toBe(nExecutions)

    backupLogs.forEach(({ tasks = [], ...log }, key) => {
      validateRootTask(
        log,
        {
          data: {
            mode,
            reportWhen: 'never',
          },
          message: 'backup',
          status: 'success',
        },
        { jobName }
      )

      const numberOfTasks = {
        export: 0,
        merge: 0,
        snapshot: 0,
        transfer: 0,
        vm: 0,
      }
      tasks.forEach(({ tasks = [], ...vmTask }) => {
        if (vmTask.data !== undefined && vmTask.data.type === 'VM') {
          validateVmTask(vmTask, vmToBackup, { status: 'success' })
          numberOfTasks.vm++
          tasks.forEach(({ tasks = [], ...subTask }) => {
            if (subTask.message === 'snapshot') {
              validateSnapshotTask(subTask, { status: 'success' })
              numberOfTasks.snapshot++
            }
            if (subTask.message === 'export') {
              validateExportTask(subTask, remotes, {
                data: {
                  id: expect.any(String),
                  isFull: key % fullInterval === 0,
                  type: 'remote',
                },
                status: 'success',
              })
              numberOfTasks.export++
              let mergeTaskKey, transferTaskKey
              tasks.forEach((operationTask, key) => {
                if (
                  operationTask.message === 'transfer' ||
                  operationTask.message === 'merge'
                ) {
                  validateOperationTask(operationTask, {
                    result: { size: expect.any(Number) },
                    status: 'success',
                  })
                  if (operationTask.message === 'transfer') {
                    mergeTaskKey = key
                    numberOfTasks.merge++
                  } else {
                    transferTaskKey = key
                    numberOfTasks.transfer++
                  }
                }
              })
              expect(
                subTask.data.id === remoteId1
                  ? mergeTaskKey > transferTaskKey
                  : mergeTaskKey < transferTaskKey
              ).toBe(true)
            }
          })
        }
      })
      expect(numberOfTasks).toEqual({
        export: 2,
        merge: 2,
        snapshot: 1,
        transfer: 2,
        vm: 1,
      })
    })
  })
})
