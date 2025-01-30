import { asyncEach } from '@vates/async-each'
import { createGzip } from 'node:zlib'
import { defer } from 'golike-defer'
import { every } from '@vates/predicates'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import { ifDef } from '@xen-orchestra/defined'
import { featureUnauthorized, invalidCredentials, noSuchObject } from 'xo-common/api-errors.js'
import { pipeline } from 'node:stream/promises'
import { json, Router } from 'express'
import { Readable } from 'node:stream'
import cloneDeep from 'lodash/cloneDeep.js'
import groupBy from 'lodash/groupBy.js'
import path from 'node:path'
import pDefer from 'promise-toolbox/defer'
import pick from 'lodash/pick.js'
import semver from 'semver'
import * as CM from 'complex-matcher'
import { VDI_FORMAT_RAW, VDI_FORMAT_VHD } from '@xen-orchestra/xapi'
import { parse } from 'xo-remote-parser'

import {
  getFromAsyncCache,
  getUserPublicProperties,
  isAlarm,
  isReplicaVm,
  isSrWritable,
  vmContainsNoBakTag,
} from '../utils.mjs'
import { compileXoJsonSchema } from './_xoJsonSchema.mjs'
import { createPredicate } from 'value-matcher'

// E.g: 'value: 0.6\nconfig:\n<variable>\n<name value="cpu_usage"/>\n<alarm_trigger_level value="0.4"/>\n<alarm_trigger_period value ="60"/>\n</variable>';
const ALARM_BODY_REGEX = /^value:\s*(Infinity|NaN|-Infinity|\d+(?:\.\d+)?)\s*config:\s*<variable>\s*<name value="(.*?)"/
const DASHBOARD_CACHE = new Map()

const { join } = path.posix
const noop = Function.prototype

function compressMaybe(req, res) {
  let transform

  const acceptEncoding = req.headers['accept-encoding']
  if (
    acceptEncoding !== undefined &&
    acceptEncoding.split(',').some(_ => _.split(';')[0].trim().toLocaleLowerCase() === 'gzip')
  ) {
    res.setHeader('content-encoding', 'gzip')
    transform = createGzip()
  }

  if (transform !== undefined) {
    pipeline(transform, res).catch(noop)
    return transform
  }
  return res
}

async function* mapIterable(iterable, mapper) {
  for await (const item of iterable) {
    yield mapper(item)
  }
}

async function* makeJsonStream(iterable) {
  yield '['
  let first = true
  for await (const object of iterable) {
    if (first) {
      first = false
      yield '\n'
    } else {
      yield ',\n'
    }
    yield JSON.stringify(object, null, 2)
  }
  yield '\n]\n'
}

async function* makeNdJsonStream(iterable) {
  for await (const object of iterable) {
    yield JSON.stringify(object)
    yield '\n'
  }
}

function makeObjectMapper(req, path = req.path) {
  const { query } = req

  const { baseUrl } = req
  const makeUrl =
    typeof path === 'function'
      ? object => join(baseUrl, path(object), typeof object.id === 'number' ? String(object.id) : object.id)
      : ({ id }) => join(baseUrl, path, typeof id === 'number' ? String(id) : id)

  let objectMapper
  let { fields } = query
  if (fields === undefined) {
    objectMapper = makeUrl
  } else if (fields === '*') {
    objectMapper = object => ({
      ...object,
      href: makeUrl(object),
    })
  } else {
    fields = fields.split(',')
    objectMapper = object => {
      const url = makeUrl(object)
      object = pick(object, fields)
      object.href = url
      return object
    }
  }

  return function (entry) {
    return objectMapper(typeof entry === 'string' ? { id: entry } : entry)
  }
}

async function sendObjects(iterable, req, res, mapper) {
  const json = !Object.hasOwn(req.query, 'ndjson')

  if (mapper !== null) {
    if (typeof mapper !== 'function') {
      mapper = makeObjectMapper(req, ...Array.prototype.slice.call(arguments, 3))
    }
    iterable = mapIterable(iterable, mapper)
  }

  res.setHeader('content-type', json ? 'application/json' : 'application/x-ndjson')
  return pipeline((json ? makeJsonStream : makeNdJsonStream)(iterable), res)
}

function handleArray(array, filter, limit) {
  if (filter !== undefined) {
    array = array.filter(filter)
  }
  if (limit < array.length) {
    array.length = limit
  }

  return array
}

const handleOptionalUserFilter = filter => filter && CM.parse(filter).createPredicate()

const subRouter = (app, path) => {
  const router = Router({ strict: false })
  app.use(path, router)
  return router
}

// wraps an async middleware
function wrap(middleware, handleNoSuchObject = false) {
  return async function asyncMiddlewareWrapped(req, res, next) {
    try {
      await middleware.apply(this, arguments)
    } catch (error) {
      if (featureUnauthorized.is(error)) {
        res.sendStatus(403)
      } else if (handleNoSuchObject && noSuchObject.is(error)) {
        res.sendStatus(404)
      } else {
        next(error)
      }
    }
  }
}

async function _getDashboardStats(app) {
  const dashboard = {}
  const dashboardCacheOps = {
    timeout: app.config.getOptionalDuration('rest-api.dashboardCacheTimeout'),
    expiresIn: app.config.getOptionalDuration('rest-api.dashboardCacheExpiresIn'),
  }

  let hvSupportedVersions
  let nHostsEol
  if (typeof app.getHVSupportedVersions === 'function') {
    try {
      hvSupportedVersions = await app.getHVSupportedVersions()
      nHostsEol = 0
    } catch (error) {
      console.error(error)
    }
  }

  const pools = Object.values(app.objects.indexes.type.pool ?? {})
  const poolIds = []
  const hosts = Object.values(app.objects.indexes.type.host ?? {})
  const srs = Object.values(app.objects.indexes.type.SR ?? {})
  const vms = Object.values(app.objects.indexes.type.VM ?? {})
  const servers = await app.getAllXenServers()

  const writableSrs = srs.filter(isSrWritable)
  const nonReplicaVms = vms.filter(vm => !isReplicaVm(vm))
  const vmIdsProtected = new Set()
  const vmIdsUnprotected = new Set()
  const resourcesOverview = { nCpus: 0, memorySize: 0, srSize: 0 }

  pools.forEach(pool => {
    resourcesOverview.nCpus += pool.cpus.cores
    poolIds.push(pool.id)
  })

  hosts.forEach(host => {
    if (hvSupportedVersions !== undefined && !semver.satisfies(host.version, hvSupportedVersions[host.productBrand])) {
      nHostsEol++
    }
    resourcesOverview.memorySize += host.memory.size
  })

  dashboard.nPools = pools.length
  dashboard.nHosts = hosts.length
  dashboard.nHostsEol = nHostsEol

  if (await app.hasFeatureAuthorization('LIST_MISSING_PATCHES')) {
    const poolsWithMissingPatches = new Set()
    let nHostsWithMissingPatches = 0

    await asyncEach(hosts, async host => {
      const xapi = app.getXapi(host)
      try {
        const patches = await xapi.listMissingPatches(host)
        if (patches.length > 0) {
          nHostsWithMissingPatches++
          poolsWithMissingPatches.add(host.$pool)
        }
      } catch (error) {
        console.error(error)
      }
    })

    const missingPatches = {
      nHostsWithMissingPatches,
      nPoolsWithMissingPatches: poolsWithMissingPatches.size,
    }

    dashboard.missingPatches = missingPatches
  }

  try {
    const brResult = await getFromAsyncCache(
      DASHBOARD_CACHE,
      'backupRepositories',
      async () => {
        const s3Brsize = { backups: 0 }
        const otherBrSize = { available: 0, backups: 0, other: 0, total: 0, used: 0 }

        const backupRepositories = await app.getAllRemotes()
        const backupRepositoriesInfo = await app.getAllRemotesInfo()

        for (const backupRepository of backupRepositories) {
          const { type } = parse(backupRepository.url)
          const backupRepositoryInfo = backupRepositoriesInfo[backupRepository.id]

          if (!backupRepository.enabled || backupRepositoryInfo === undefined) {
            continue
          }

          const totalBackupSize = await app.getTotalBackupSizeOnRemote(backupRepository.id)

          const { available, size, used } = backupRepositoryInfo

          const isS3 = type === 's3'
          const target = isS3 ? s3Brsize : otherBrSize

          target.backups += totalBackupSize.onDisk
          if (!isS3) {
            target.available += available
            target.other += used - totalBackupSize.onDisk
            target.total += size
            target.used += used
          }
        }

        return { s3: { size: s3Brsize }, other: { size: otherBrSize } }
      },
      dashboardCacheOps
    )

    if (brResult.value !== undefined) {
      dashboard.backupRepositories = { ...brResult.value, isExpired: brResult.isExpired }
    }
  } catch (error) {
    console.error(error)
  }

  function isReplicaVmInVdb($VBDs) {
    for (const vbd of $VBDs) {
      try {
        const vdbObject = app.getObject(vbd, ['VBD'])
        const { VM } = vdbObject
        const vmObject = app.getObject(VM, ['VM', 'VM-snapshot', 'VM-template'])
        if (isReplicaVm(vmObject)) {
          return true
        }
      } catch (err) {}
    }
    return false
  }

  function calculateReplicatedSize(vdi, cache) {
    if (cache.has(vdi)) {
      return 0
    }

    let vdiObject
    try {
      vdiObject = app.getObject(vdi, ['VDI', 'VDI-snapshot', 'VDI-unmanaged'])
      cache.set(vdi, vdiObject)
    } catch (err) {
      return 0
    }

    const { parent, usage, $VBDs } = vdiObject
    const replicaUsage = isReplicaVmInVdb($VBDs) && usage ? usage : 0
    const parentUsage = parent ? calculateReplicatedSize(parent, cache) : 0

    return replicaUsage + parentUsage
  }

  const storageRepositoriesSize = writableSrs.reduce(
    function processSr(acc, sr) {
      const cache = new Map()
      const { VDIs } = sr

      const replicated = VDIs.reduce((total, vdi) => {
        return total + calculateReplicatedSize(vdi, cache)
      }, 0)

      return {
        replicated: acc.replicated + replicated,
        total: acc.total + sr.size,
        used: acc.used + sr.physical_usage,
      }
    },
    {
      replicated: 0,
      total: 0,
      used: 0,
    }
  )

  storageRepositoriesSize.available = storageRepositoriesSize.total - storageRepositoriesSize.used
  storageRepositoriesSize.other = storageRepositoriesSize.total - storageRepositoriesSize.replicated
  resourcesOverview.srSize = storageRepositoriesSize.total

  dashboard.storageRepositories = { size: storageRepositoriesSize }
  dashboard.resourcesOverview = resourcesOverview

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
            backupJobIssues.push({ logs: jobLogs.map(log => log.status), name: job.name, type: job.type, uuid: job.id })
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

  let nConnectedServers = 0
  let nUnreachableServers = 0
  let nUnknownServers = 0
  servers.forEach(server => {
    // it may happen that some servers are marked as "connected", but no pool matches "server.pool"
    // so they are counted as `nUnknownServers`
    if (server.status === 'connected' && poolIds.includes(server.poolId)) {
      nConnectedServers++
      return
    }

    if (
      server.status === 'disconnected' &&
      server.error !== undefined &&
      server.error.connectedServerId === undefined
    ) {
      nUnreachableServers++
      return
    }

    if (server.status === 'disconnected') {
      return
    }

    nUnknownServers++
  })

  dashboard.poolsStatus = { connected: nConnectedServers, unreachable: nUnreachableServers, unknown: nUnknownServers }
  return dashboard
}

const keepNonAlarmMessages = message => message.type === 'message' && !isAlarm(message)
export default class RestApi {
  #api

  constructor(app, { express }) {
    // don't setup the API if express is not present
    //
    // that can happen when the app is instanciated in another context like xo-server-recover-account
    if (express === undefined) {
      return
    }

    const api = subRouter(express, '/rest/v0')
    this.#api = api

    // register the route BEFORE the authentication middleware because this route does not require authentication
    api.post('/users/authentication_tokens', json(), async (req, res) => {
      const authorization = req.headers.authorization ?? ''
      const [, encodedCredentials] = authorization.split(' ')
      if (encodedCredentials === undefined) {
        return res.status(401).json('missing credentials')
      }

      const [username, password] = Buffer.from(encodedCredentials, 'base64').toString().split(':')

      try {
        const { user } = await app.authenticateUser({ username, password, otp: req.query.otp })
        const token = await app.createAuthenticationToken({
          client: req.body.client,
          userId: user.id,
          description: req.body.description,
          expiresIn: req.body.expiresIn,
        })
        res.json({ token })
      } catch (error) {
        if (invalidCredentials.is(error)) {
          res.status(401)
        } else {
          res.status(400)
        }
        res.json(error.message)
      }
    })

    api.use((req, res, next) => {
      const { cookies, ip } = req
      app.authenticateUser({ token: cookies.authenticationToken ?? cookies.token }, { ip }).then(
        ({ user }) => {
          if (user.permission === 'admin') {
            return app.runWithApiContext(user, next)
          }

          res.sendStatus(401)
        },
        error => {
          if (invalidCredentials.is(error)) {
            res.sendStatus(401)
          } else {
            next(error)
          }
        }
      )
    })

    const collections = { __proto__: null }

    const withParams = (fn, paramsSchema) => {
      fn.params = paramsSchema
      fn.validateParams = compileXoJsonSchema({ type: 'object', properties: cloneDeep(paramsSchema) })
      return fn
    }

    {
      const types = [
        'host',
        'message',
        'network',
        'PIF',
        'pool',
        'SR',
        'VBD',
        'VDI-snapshot',
        'VDI',
        'VIF',
        'VM-controller',
        'VM-snapshot',
        'VM-template',
        'VM',
      ]
      function getObject(id, req) {
        const { type } = this
        const object = app.getObject(id, type)

        // add also the XAPI version of the object
        req.xapiObject = app.getXapiObject(object)

        return object
      }
      function getObjects(filter, limit) {
        return Object.values(
          app.getObjects({
            filter: every(this.isCorrectType, filter),
            limit,
          })
        )
      }
      async function messages(req, res) {
        const {
          object: { id },
          query,
        } = req
        await sendObjects(
          Object.values(
            app.getObjects({
              filter: every(_ => _.$object === id, keepNonAlarmMessages, handleOptionalUserFilter(query.filter)),
              limit: ifDef(query.limit, Number),
            })
          ),
          req,
          res,
          '/messages'
        )
      }

      async function alarms(req, res) {
        const {
          object: { id },
          query,
        } = req
        await sendObjects(
          Object.values(
            app.getObjects({
              filter: every(_ => _.$object === id, isAlarm, handleOptionalUserFilter(query.filter)),
              limit: ifDef(query.limit, Number),
            })
          ),
          req,
          res,
          '/alarms'
        )
      }

      for (const type of types) {
        const id = type.toLocaleLowerCase() + 's'

        collections[id] = {
          getObject,
          getObjects,
          routes: { messages, alarms },
          isCorrectType: _ => _.type === type,
          type,
        }
      }

      collections.hosts.routes = {
        ...collections.hosts.routes,

        async 'audit.txt'(req, res) {
          const host = req.xapiObject

          const response = await host.$xapi.getResource('/audit_log', { host })

          res.setHeader('content-type', 'text/plain')
          await pipeline(response.body, compressMaybe(req, res))
        },

        async 'logs.tgz'(req, res) {
          const host = req.xapiObject

          const response = await host.$xapi.getResource('/host_logs_download', { host })

          res.setHeader('content-type', 'application/gzip')
          await pipeline(response.body, res)
        },

        async missing_patches(req, res) {
          await app.checkFeatureAuthorization('LIST_MISSING_PATCHES')

          const host = req.xapiObject
          res.json(await host.$xapi.listMissingPatches(host))
        },

        async smt({ xapiObject }, res) {
          res.json({ enabled: await xapiObject.$xapi.isHyperThreadingEnabled(xapiObject.$id) })
        },
      }

      collections.pools.routes = {
        ...collections.pools.routes,

        async missing_patches(req, res) {
          await app.checkFeatureAuthorization('LIST_MISSING_PATCHES')

          const xapi = req.xapiObject.$xapi
          const missingPatches = new Map()
          await asyncEach(Object.values(xapi.objects.indexes.type.host ?? {}), async host => {
            try {
              for (const patch of await xapi.listMissingPatches(host)) {
                const { uuid: key = `${patch.name}-${patch.version}-${patch.release}` } = patch
                missingPatches.set(key, patch)
              }
            } catch (error) {
              console.warn(host.uuid, error)
            }
          })
          res.json(Array.from(missingPatches.values()))
        },
      }

      {
        async function vdis(req, res) {
          const vdis = new Map()
          for (const vbdId of req.object.$VBDs) {
            try {
              const vbd = app.getObject(vbdId, 'VBD')
              const vdiId = vbd.VDI
              if (vdiId !== undefined) {
                const vdi = app.getObject(vdiId, ['VDI', 'VDI-snapshot'])
                vdis.set(vdiId, vdi)
              }
            } catch (error) {
              console.warn('REST API', req.url, { error })
            }
          }

          const { query } = req
          await sendObjects(
            handleArray(Array.from(vdis.values()), handleOptionalUserFilter(query.filter), ifDef(query.limit, Number)),
            req,
            res,
            makeObjectMapper(req, ({ type }) => type.toLowerCase() + 's')
          )
        }

        for (const collection of ['vms', 'vm-controllers', 'vm-snapshots', 'vm-templates']) {
          collections[collection].routes.vdis = vdis
        }
      }

      collections.pools.actions = {
        create_vm: withParams(
          defer(
            async (
              $defer,
              { xapiObject: { $xapi } },
              { affinity, boot, cloud_config, destroy_cloud_config_vdi, install, network_config, template, ...params },
              req
            ) => {
              params.affinityHost = affinity
              params.installRepository = install?.repository

              const vm = await $xapi.createVm(template, params, undefined, app.apiContext.user.id)
              $defer.onFailure.call($xapi, 'VM_destroy', vm.$ref)

              let cloudConfigVdiUuid
              if (cloud_config !== undefined) {
                cloudConfigVdiUuid = await $xapi.VM_createCloudInitConfig(vm.$ref, cloud_config, {
                  networkConfig: network_config,
                })
              }

              let timeLimit
              if (boot) {
                timeLimit = Date.now() + 10 * 60 * 1000
                await $xapi.callAsync('VM.start', vm.$ref, false, false)
              }

              if (destroy_cloud_config_vdi && cloudConfigVdiUuid !== undefined && boot) {
                try {
                  await $xapi.VDI_destroyCloudInitConfig($xapi.getObject(cloudConfigVdiUuid).$ref, {
                    timeLimit,
                  })
                } catch (error) {
                  console.error('destroy cloud init config VDI failed', {
                    error,
                    vdi: { uuid: cloudConfigVdiUuid },
                    vm: { uuid: vm.uuid },
                  })
                }
              }

              return vm.uuid
            }
          ),
          {
            affinity: { type: 'string', optional: true },
            auto_poweron: { type: 'boolean', optional: true },
            boot: { type: 'boolean', default: false },
            clone: { type: 'boolean', default: true },
            cloud_config: { type: 'string', optional: true },
            destroy_cloud_config_vdi: { type: 'boolean', default: false },
            install: {
              type: 'object',
              optional: true,
              properties: {
                method: { enum: ['cdrom', 'network'] },
                repository: { type: 'string' },
              },
            },
            memory: { type: 'integer', optional: true },
            name_description: { type: 'string', minLength: 0, optional: true },
            name_label: { type: 'string' },
            network_config: { type: 'string', optional: true },
            template: { type: 'string' },
            vdis: {
              type: 'array',
              default: [],
              items: {
                type: 'object',
                properties: {
                  destroy: { type: 'boolean', optional: true },
                  userdevice: { type: 'string', optional: true },
                  size: { type: 'number', optional: true },
                  sr: { type: 'string', optional: true },
                  name_description: { type: 'string', optional: true },
                  name_label: { type: 'string', optional: true },
                },
                if: {
                  not: {
                    required: ['userdevice'],
                  },
                },
                then: {
                  required: ['size', 'name_label'],
                  not: {
                    required: ['destroy'],
                  },
                },
              },
            },
            vifs: {
              default: [],
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  destroy: { type: 'boolean', optional: true },
                  device: { type: 'string', optional: true },
                  ipv4_allowed: { type: 'array', items: { type: 'string' }, optional: true },
                  ipv6_allowed: { type: 'array', items: { type: 'string' }, optional: true },
                  mac: { type: 'string', optional: true },
                  network: { type: 'string', optional: true },
                },
              },
            },
          }
        ),
        emergency_shutdown: async ({ xapiObject }) => {
          await app.checkFeatureAuthorization('POOL_EMERGENCY_SHUTDOWN')

          await xapiObject.$xapi.pool_emergencyShutdown()
        },
        rolling_reboot: async ({ object }) => {
          await app.checkFeatureAuthorization('ROLLING_POOL_REBOOT')

          await app.rollingPoolReboot(object)
        },
        rolling_update: async ({ object }) => {
          await app.checkFeatureAuthorization('ROLLING_POOL_UPDATE')

          await app.rollingPoolUpdate(object)
        },
      }
      collections.vms.actions = {
        clean_reboot: ({ xapiObject: vm }) => vm.$callAsync('clean_reboot').then(noop),
        clean_shutdown: ({ xapiObject: vm }) => vm.$callAsync('clean_shutdown').then(noop),
        hard_reboot: ({ xapiObject: vm }) => vm.$callAsync('hard_reboot').then(noop),
        hard_shutdown: ({ xapiObject: vm }) => vm.$callAsync('hard_shutdown').then(noop),
        snapshot: withParams(
          async ({ xapiObject: vm }, { name_label }) => {
            const ref = await vm.$snapshot({ ignoredVdisTag: '[NOSNAP]', name_label })
            return vm.$xapi.getField('VM', ref, 'uuid')
          },
          { name_label: { type: 'string', optional: true } }
        ),
        start: ({ xapiObject: vm }) => vm.$callAsync('start', false, false).then(noop),
      }
    }

    collections.backup = {}
    collections.groups = {
      getObject(id) {
        return app.getGroup(id)
      },
      async getObjects(filter, limit) {
        return handleArray(await app.getAllGroups(), filter, limit)
      },
      routes: {
        async users(req, res) {
          const { filter, limit } = req.query
          await sendObjects(
            handleArray(
              await Promise.all(req.object.users.map(id => app.getUser(id).then(getUserPublicProperties))),
              handleOptionalUserFilter(filter),
              ifDef(limit, Number)
            ),
            req,
            res,
            '/users'
          )
        },
      },
    }
    collections.restore = {}
    collections.tasks = {
      async getObject(id, req) {
        const { wait } = req.query
        if (wait !== undefined) {
          const { promise, resolve } = pDefer()
          const stopWatch = await app.tasks.watch(id, task => {
            if (wait !== 'result' || task.status !== 'pending') {
              stopWatch()
              resolve(task)
            }
          })
          req.on('close', stopWatch)
          return promise
        } else {
          return app.tasks.get(id)
        }
      },
      getObjects(filter, limit) {
        return app.tasks.list({ filter, limit })
      },
      watch(filter) {
        const stream = new Readable({ objectMode: true, read: noop })
        const onUpdate = object => {
          if (filter === undefined || filter(object)) {
            stream.push(['update', object])
          }
        }
        const onRemove = id => {
          stream.push(['remove', id])
        }
        app.tasks.on('update', onUpdate).on('remove', onRemove)
        stream.on('close', () => {
          app.tasks.off('update', onUpdate).off('remove', onRemove)
        })
        return stream[Symbol.asyncIterator]()
      },
    }
    collections.servers = {
      getObject(id) {
        return app.getXenServer(id)
      },
      async getObjects(filter, limit) {
        return handleArray(await app.getAllXenServers(), filter, limit)
      },
    }
    collections.users = {
      getObject(id) {
        return app.getUser(id).then(getUserPublicProperties)
      },
      async getObjects(filter, limit) {
        return handleArray(await app.getAllUsers(), filter, limit)
      },
      routes: {
        async authentication_tokens(req, res) {
          const { filter, limit } = req.query

          const me = app.apiContext.user
          const user = req.object
          if (me.id !== user.id) {
            return res.status(403).json('You can only see your own authentication tokens')
          }

          const tokens = await app.getAuthenticationTokensForUser(me.id)

          res.json(handleArray(tokens, filter, limit))
        },
        async groups(req, res) {
          const { filter, limit } = req.query
          await sendObjects(
            handleArray(
              await Promise.all(req.object.groups.map(id => app.getGroup(id))),
              handleOptionalUserFilter(filter),
              ifDef(limit, Number)
            ),
            req,
            res,
            '/groups'
          )
        },
      },
    }
    collections.dashboard = {}
    collections.messages = {
      getObject(id) {
        const message = app.getObject(id, 'message')
        if (isAlarm(message)) {
          throw noSuchObject(id, 'message')
        }

        return message
      },
      getObjects(filter, limit) {
        return handleArray(
          Object.values(
            app.getObjects({
              filter: every(keepNonAlarmMessages, filter),
              limit,
            })
          )
        )
      },
    }
    collections.alarms = {
      getObject(id, req) {
        const alarm = app.getObject(id, 'message')
        if (!isAlarm(alarm)) {
          throw noSuchObject(id, 'alarm')
        }

        const { $object, body } = alarm
        let object = {}
        try {
          object = app.getObject($object)
        } catch (error) {
          object = {
            type: 'unknown',
            uuid: $object,
          }
        }

        const { baseUrl } = req
        const objType = object.type.toLowerCase() + 's'
        const href = collections[objType] === undefined ? undefined : `${baseUrl}/${objType}/${object.uuid}`
        const [, value, name] = body.match(ALARM_BODY_REGEX) ?? []

        return {
          ...alarm,
          body: {
            value, // Keep the value as a string because NaN, Infinity, -Infinity is not valid JSON
            name: name ?? body, // for 'BOND_STATUS_CHANGED' and 'MULTIPATH_PERIODIC_ALERT', body is a non-xml string. ("body": "The status of the eth0+eth1 bond is: 1/2 up")
          },
          object: {
            type: object.type,
            uuid: object.uuid,
            href,
          },
        }
      },
      getObjects(filter, limit) {
        return handleArray(
          Object.values(
            app.getObjects({
              filter: every(isAlarm, filter),
              limit,
            })
          )
        )
      },
    }

    // normalize collections
    for (const id of Object.keys(collections)) {
      const collection = collections[id]

      // inject id into the collection
      collection.id = id

      // set null as prototypes to speed-up look-ups
      Object.setPrototypeOf(collection, null)
      const { actions, routes } = collection
      if (actions !== undefined) {
        Object.setPrototypeOf(actions, null)
      }
      if (routes !== undefined) {
        Object.setPrototypeOf(routes, null)
      }
    }

    api.param('collection', (req, res, next) => {
      const id = req.params.collection
      const collection = collections[id]
      if (collection === undefined) {
        next('route')
      } else {
        req.collection = collection
        next()
      }
    })
    api.param('object', async (req, res, next) => {
      const { collection } = req
      if (collection === undefined || collection.getObject === undefined) {
        return next('route')
      }

      const id = req.params.object
      try {
        // eslint-disable-next-line require-atomic-updates
        req.object = await collection.getObject(id, req)
        return next()
      } catch (error) {
        if (noSuchObject.is(error, { id })) {
          next('route')
        } else {
          next(error)
        }
      }
    })

    api.get(
      '/',
      wrap((req, res) => sendObjects(Object.values(collections), req, res))
    )

    // For compatibility redirect from /backups* to /backup
    api.get('/backups*', (req, res) => {
      res.redirect(308, req.baseUrl + '/backup' + req.params[0])
    })

    // handle /users/me and /users/me/*
    api.get(/^\/users\/me(\/.*)?$/, (req, res) => {
      const user = app.apiContext.user
      res.redirect(307, req.baseUrl + '/users/' + user.id + (req.params[0] ?? ''))
    })

    const backupTypes = {
      __proto__: null,

      metadata: 'metadataBackup',
      mirror: 'mirrorBackup',
      vm: 'backup',
    }

    api
      .get(
        '/backup',
        wrap((req, res) => sendObjects([{ id: 'jobs' }, { id: 'logs' }], req, res))
      )
      .get(
        '/backup/logs',
        wrap(async (req, res) => {
          const { filter, limit } = req.query
          const logs = await app.getBackupNgLogsSorted({
            filter: every(({ message: m }) => m === 'backup' || m === 'metadata', handleOptionalUserFilter(filter)),
            limit: ifDef(limit, Number),
          })
          await sendObjects(logs, req, res)
        })
      )
      .get(
        '/backup/jobs',
        wrap((req, res) =>
          sendObjects(
            Object.keys(backupTypes).map(id => ({ id })),
            req,
            res
          )
        )
      )

    for (const [collection, type] of Object.entries(backupTypes)) {
      api
        .get(
          '/backup/jobs/' + collection,
          wrap(async (req, res) => sendObjects(await app.getAllJobs(type), req, res))
        )
        .get(
          `/backup/jobs/${collection}/:id`,
          wrap(async (req, res) => {
            res.json(await app.getJob(req.params.id, type))
          }, true)
        )
    }

    // For compatibility, redirect /backup/jobs/:id to /backup/jobs/vm/:id
    api.get('/backup/jobs/:id', (req, res) => {
      res.redirect(308, req.baseUrl + '/backup/jobs/vm/' + req.params.id)
    })

    api.get(
      '/dashboard',
      wrap(async (req, res) => {
        res.json(await _getDashboardStats(app))
      })
    )

    api
      .get(
        '/restore',
        wrap((req, res) => sendObjects([{ id: 'logs' }], req, res))
      )
      .get(
        '/restore/logs',
        wrap(async (req, res) => {
          const { filter, limit } = req.query
          const logs = await app.getBackupNgLogsSorted({
            filter: every(_ => _.message === 'restore', handleOptionalUserFilter(filter)),
            limit: ifDef(limit, Number),
          })
          await sendObjects(logs, req, res)
        })
      )
      .get(
        ['/backup/logs/:id', '/restore/logs/:id'],
        wrap(async (req, res) => {
          res.json(await app.getBackupNgLogs(req.params.id))
        })
      )

    api
      .delete(
        '/tasks',
        wrap(async (req, res) => {
          await app.tasks.clearLogs()
          res.sendStatus(200)
        })
      )
      .delete(
        '/tasks/:id',
        wrap(async (req, res) => {
          await app.tasks.deleteLog(req.params.id)
          res.sendStatus(200)
        })
      )
      .get(
        '/tasks/:id/actions',
        wrap(async (req, res) => {
          const task = await app.tasks.get(req.params.id)

          await sendObjects(task.status === 'pending' ? [{ id: 'abort' }] : [], req, res)
        })
      )
      .post(
        '/tasks/:id/actions/abort',
        wrap(async (req, res) => {
          const { id } = req.params
          await app.tasks.abort(id)
          res.status = 202
          res.end(req.baseUrl + '/tasks/' + id)
        }, true)
      )

    api.get(
      '/:collection',
      wrap(async (req, res) => {
        const { collection, query } = req

        const filter = handleOptionalUserFilter(query.filter)

        if (Object.hasOwn(query, 'ndjson') && Object.hasOwn(query, 'watch')) {
          const objectMapper = makeObjectMapper(req)
          const entryMapper = entry => [entry[0], objectMapper(entry[1])]

          try {
            await sendObjects(collection.watch(filter), req, res, entryMapper)
          } catch (error) {
            // ignore premature close in watch mode
            if (error.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
              throw error
            }
          }
          return
        }

        await sendObjects(await collection.getObjects(filter, ifDef(query.limit, Number)), req, res)
      })
    )

    // should go before routes /:collection/:object because they will match but
    // will not work due to the extension being included in the object identifer
    api.get(
      '/:collection(vdis|vdi-snapshots)/:object.:format(vhd|raw)',
      wrap(async (req, res) => {
        const preferNbd = Object.hasOwn(req.query, 'preferNbd')
        const nbdConcurrency = req.query.nbdConcurrency && parseInt(req.query.nbdConcurrency)
        const stream = await req.xapiObject.$exportContent({ format: req.params.format, preferNbd, nbdConcurrency })

        const headers = { 'content-disposition': 'attachment' }

        const { length } = stream
        if (length !== undefined) {
          headers['content-length'] = length
        }

        res.writeHead(200, 'OK', headers)
        await pipeline(stream, res)
      })
    )
    api.put(
      '/:collection(vdis|vdi-snapshots)/:object.:format(vhd|raw)',
      wrap(async (req, res) => {
        req.length = +req.headers['content-length']
        await req.xapiObject.$importContent(req, { format: req.params.format })

        res.sendStatus(204)
      })
    )
    api.get(
      '/:collection(vms|vm-snapshots|vm-templates)/:object.:format(ova|xva)',
      wrap(async (req, res) => {
        const vm = req.xapiObject

        const stream =
          req.params.format === 'ova'
            ? await vm.$xapi.exportVmOva(vm.$ref)
            : (
                await vm.$export({
                  compress: req.query.compress,
                })
              ).body

        res.setHeader('content-disposition', 'attachment')
        await pipeline(stream, res)
      })
    )

    api.get('/:collection/:object', (req, res) => {
      let result = req.object

      // add locations of sub-routes for discoverability
      const { routes } = req.collection
      if (routes !== undefined) {
        result = { ...result }
        for (const route of Object.keys(routes)) {
          result[route.split('.')[0] + '_href'] = join(req.baseUrl, req.path, route)
        }
      }

      res.json(result)
    })
    api
      .patch(
        '/:collection/:object',
        json(),
        wrap(async (req, res) => {
          const obj = req.xapiObject

          const promises = []
          const { body } = req

          for (const key of ['name_description', 'name_label', 'tags']) {
            const value = body[key]
            if (value !== undefined) {
              promises.push(obj['set_' + key](value))
            }
          }

          await promises
          res.sendStatus(204)
        })
      )
      .delete(
        '/:collection/:object/tags/:tag',
        wrap(async (req, res) => {
          await req.xapiObject.$call('remove_tags', req.params.tag)

          res.sendStatus(204)
        })
      )
      .put(
        '/:collection/:object/tags/:tag',
        wrap(async (req, res) => {
          await req.xapiObject.$call('add_tags', req.params.tag)

          res.sendStatus(204)
        })
      )

    api.get(
      '/:collection/:object/tasks',
      wrap(async (req, res) => {
        const { query } = req
        const objectId = req.object.id
        const tasks = app.tasks.list({
          filter: every(
            _ => _.status === 'pending' && _.properties.objectId === objectId,
            handleOptionalUserFilter(query.filter)
          ),
          limit: ifDef(query.limit, Number),
        })
        await sendObjects(tasks, req, res, '/tasks')
      })
    )

    api.get(
      ['/:collection/_/actions', '/:collection/:object/actions'],
      wrap((req, res) => {
        const { actions } = req.collection
        return sendObjects(
          actions === undefined ? [] : Array.from(Object.keys(actions), id => ({ ...actions[id], id })),
          req,
          res
        )
      })
    )
    api.get(['/:collection/_/actions/:action', '/:collection/:object/actions/:action'], (req, res, next) => {
      const { action: id } = req.params
      const action = req.collection.actions?.[id]
      if (action === undefined) {
        return next()
      }

      res.json({ ...action })
    })
    api.post('/:collection/:object/actions/:action', json(), (req, res, next) => {
      const { action } = req.params
      const fn = req.collection.actions?.[action]
      if (fn === undefined) {
        return next()
      }

      const params = req.body

      const { validateParams } = fn
      if (validateParams !== undefined) {
        if (!validateParams(params)) {
          res.statusCode = 400
          return res.json(validateParams.errors)
        }
      }

      const { object, xapiObject } = req
      const task = app.tasks.create({ name: `REST: ${action} ${req.collection.type}`, objectId: object.id })
      const pResult = task.run(() => fn({ object, xapiObject }, params, req))
      if (Object.hasOwn(req.query, 'sync')) {
        pResult.then(result => res.json(result), next)
      } else {
        pResult.catch(noop)
        res.statusCode = 202
        res.end(req.baseUrl + '/tasks/' + task.id)
      }
    })

    api.get(
      '/:collection/:object/:route',
      wrap((req, res, next) => {
        const handler = req.collection.routes?.[req.params.route]
        if (handler !== undefined) {
          return handler(req, res, next)
        }
        return next()
      })
    )

    api.post(
      '/:collection(pools)/:object/vms',
      wrap(async (req, res) => {
        let srRef
        const { sr } = req.params
        if (sr !== undefined) {
          srRef = app.getXapiObject(sr, 'SR').$ref
        }

        const { $xapi } = req.xapiObject
        const ref = await $xapi.VM_import(req, srRef)

        res.end(await $xapi.getField('VM', ref, 'uuid'))
      })
    )

    api.post(
      '/:collection(srs)/:object/vdis',
      wrap(async (req, res) => {
        const sr = req.xapiObject
        req.length = ifDef(req.headers['content-length'], Number)

        const { name_label, name_description, raw } = req.query
        const vdiRef = await sr.$importVdi(req, {
          format: raw !== undefined ? VDI_FORMAT_RAW : VDI_FORMAT_VHD,
          name_label,
          name_description,
        })

        res.end(await sr.$xapi.getField('VDI', vdiRef, 'uuid'))
      })
    )

    api.delete(
      '/:collection(vdis|vdi-snapshots|vms|vm-snapshots|vm-templates)/:object',
      wrap(async (req, res) => {
        await req.xapiObject.$destroy()
        res.sendStatus(200)
      })
    )

    api.delete(
      '/:collection(groups)/:id',
      wrap(async (req, res) => {
        const { id } = req.params
        await app.deleteGroup(id)
        res.sendStatus(204)
      })
    )
  }

  registerRestApi(spec, base = '/') {
    for (const path of Object.keys(spec)) {
      if (path[0] === '_') {
        const handler = spec[path]
        this.#api[path.slice(1)](base, json(), async (req, res, next) => {
          try {
            const result = await handler(req, res, next)
            if (result !== undefined) {
              const isIterable =
                result !== null && typeof (result[Symbol.iterator] ?? result[Symbol.asyncIterator]) === 'function'
              if (isIterable) {
                await sendObjects(result, req, res)
              } else {
                res.json(result)
              }
            }
          } catch (error) {
            next(error)
          }
        })
      } else {
        this.registerRestApi(spec[path], join(base, path))
      }
    }
    return () => {
      throw new Error('not implemented')
    }
  }
}
