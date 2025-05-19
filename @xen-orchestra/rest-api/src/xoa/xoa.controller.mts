// @ts-nocheck
import { Controller, Get, Response, Route, Security, Tags } from 'tsoa'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import { provide } from 'inversify-binding-decorators'
import { unauthorizedResp } from '../open-api/common/response.common.mjs'
import { inject } from 'inversify'
import { RestApi } from '../rest-api/rest-api.mjs'
import { getFromAsyncCache } from '../helpers/cache.helper.mjs'
import groupBy from 'lodash/groupBy.js'
import { createPredicate } from 'value-matcher'
import { XoaDashboard } from './xoa.type.mjs'
import { XoaService } from './xoa.service.mjs'

const DASHBOARD_CACHE = new Map()

export const isSrWritable = sr => sr !== undefined && sr.content_type !== 'iso' && sr.size > 0
export const isReplicaVm = vm => 'start' in vm.blockedOperations && vm.other['xo:backup:job'] !== undefined
export const vmContainsNoBakTag = vm => vm.tags.some(t => t.split('=', 1)[0] === 'xo:no-bak')

@Route('')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('xoa')
@provide(XoaController)
export class XoaController extends Controller {
  #restApi: RestApi
  #xoaService: XoaService

  constructor(@inject(RestApi) restApi: RestApi, @inject(XoaService) xoaService: XoaService) {
    super()
    this.#restApi = restApi
    this.#xoaService = xoaService
  }

  // @
  async _getDashboardStats() {
    const app = this.#restApi.xoApp
    const dashboard = {}
    const dashboardCacheOps = {
      timeout: app.config.getOptionalDuration('rest-api.dashboardCacheTimeout'),
      expiresIn: app.config.getOptionalDuration('rest-api.dashboardCacheExpiresIn'),
    }

    const vms = Object.values(app.objects.indexes.type.VM ?? {})

    const nonReplicaVms = vms.filter(vm => !isReplicaVm(vm))
    const vmIdsProtected = new Set()
    const vmIdsUnprotected = new Set()

    async function _jobHasAtLeastOneScheduleEnabled(job) {
      for (const maybeScheduleId in job.settings) {
        if (maybeScheduleId === '') {
          continue
        }

        try {
          const schedule = await app.getSchedule(maybeScheduleId)
          if (schedule.enabled) {
            return true
          }
        } catch (error) {
          if (!noSuchObject.is(error, { id: maybeScheduleId, type: 'schedule' })) {
            console.error(error)
          }
          continue
        }
      }
      return false
    }

    /**
     * Some IDs may not exists anymore
     * @param {object} job
     * @returns {string[]}
     */
    function _extractVmIdsFromBackupJob(job) {
      let vmIds
      try {
        vmIds = extractIdsFromSimplePattern(job.vms)
      } catch (_) {
        const predicate = createPredicate(job.vms)
        vmIds = nonReplicaVms.filter(predicate).map(vm => vm.id)
      }
      return vmIds
    }

    function _updateVmProtection(vmId, isProtected) {
      if (vmIdsProtected.has(vmId) || !app.hasObject(vmId, 'VM')) {
        return
      }

      const vm = app.getObject(vmId, 'VM')
      if (vmContainsNoBakTag(vm)) {
        return
      }

      if (isProtected) {
        vmIdsProtected.add(vmId)
        vmIdsUnprotected.delete(vmId)
      } else {
        vmIdsUnprotected.add(vmId)
      }
    }

    function _processVmsProtection(job, isProtected) {
      if (job.type !== 'backup') {
        return
      }

      _extractVmIdsFromBackupJob(job).forEach(vmId => {
        _updateVmProtection(vmId, isProtected)
      })
    }

    try {
      const backupsResult = await getFromAsyncCache(
        DASHBOARD_CACHE,
        'backups',
        async () => {
          const [logs, jobs] = await Promise.all([
            app.getBackupNgLogsSorted({
              filter: log => log.message === 'backup' || log.message === 'metadata',
            }),
            Promise.all([
              app.getAllJobs('backup'),
              app.getAllJobs('mirrorBackup'),
              app.getAllJobs('metadataBackup'),
            ]).then(jobs => jobs.flat(1)),
          ])
          const logsByJob = groupBy(logs, 'jobId')

          let disabledJobs = 0
          let failedJobs = 0
          let skippedJobs = 0
          let successfulJobs = 0
          const backupJobIssues = []

          for (const job of jobs) {
            if (!(await _jobHasAtLeastOneScheduleEnabled(job))) {
              _processVmsProtection(job, false)
              disabledJobs++
              continue
            }

            // Get only the last 3 runs
            const jobLogs = logsByJob[job.id]?.slice(-3).reverse()
            if (jobLogs === undefined || jobLogs.length === 0) {
              _processVmsProtection(job, false)
              continue
            }

            if (job.type === 'backup') {
              const lastJobLog = jobLogs[0]
              const { tasks, status } = lastJobLog

              if (tasks === undefined) {
                _processVmsProtection(job, status === 'success')
              } else {
                tasks.forEach(task => {
                  _updateVmProtection(task.data.id, task.status === 'success')
                })
              }
            }

            const failedLog = jobLogs.find(log => log.status !== 'success')
            if (failedLog !== undefined) {
              const { status } = failedLog
              if (status === 'failure' || status === 'interrupted') {
                failedJobs++
              } else if (status === 'skipped') {
                skippedJobs++
              }
              backupJobIssues.push({
                logs: jobLogs.map(log => log.status),
                name: job.name,
                type: job.type,
                uuid: job.id,
              })
            } else {
              successfulJobs++
            }
          }

          const nVmsProtected = vmIdsProtected.size
          const nVmsUnprotected = vmIdsUnprotected.size
          const nVmsNotInJob = nonReplicaVms.length - (nVmsProtected + nVmsUnprotected)

          return {
            jobs: {
              disabled: disabledJobs,
              failed: failedJobs,
              skipped: skippedJobs,
              successful: successfulJobs,
              total: jobs.length,
            },
            issues: backupJobIssues,
            vmsProtection: {
              protected: nVmsProtected,
              unprotected: nVmsUnprotected,
              notInJob: nVmsNotInJob,
            },
          }
        },
        dashboardCacheOps
      )
      if (backupsResult.value !== undefined) {
        dashboard.backups = { ...backupsResult.value, isExpired: backupsResult.isExpired }
      }
    } catch (error) {
      console.error(error)
    }

    return dashboard
  }

  @Get('dashboard')
  async getDashboard(): XoaDashboard {
    const _dashboard = await this._getDashboardStats()
    const dashboard = await this.#xoaService.getDashboard()
    return { ..._dashboard, ...dashboard }
  }
}
