/* eslint-env jest */
import Xo from 'xo-lib'
import { Collection as XoCollection } from 'xo-collection'
import { decorateClass } from '@vates/decorate-with'
import defaultsDeep from 'lodash/defaultsDeep.js'
import find from 'lodash/find.js'
import forOwn from 'lodash/forOwn.js'
import iteratee from 'lodash/iteratee.js'
import pick from 'lodash/pick.js'
import { defer } from 'golike-defer'
import { fromEvent } from 'promise-toolbox'
// import { parseDuration } from '@vates/parse-duration'
// import {before, after, afterEach} from 'node:test'

import config from './_config.mjs'
import { getDefaultName } from './_defaultValues.mjs'

export class XoConnection extends Xo.default {
  constructor(opts) {
    super(opts)

    const objects = (this._objects = new XoCollection())
    const watchers = (this._watchers = {})
    this._tempResourceDisposers = []
    this._durableResourceDisposers = []

    this.on('notification', ({ method, params }) => {
      if (method !== 'all') {
        return
      }

      const fn = params.type === 'exit' ? objects.unset : objects.set
      forOwn(params.items, (item, id) => {
        fn.call(objects, id, item)

        const watcher = watchers[id]
        if (watcher !== undefined) {
          watcher(item)
          delete watchers[id]
        }
      })
    })
  }

  get objects() {
    return this._objects
  }

  async _fetchObjects() {
    const { _objects: objects, _watchers: watchers } = this
    forOwn(await this.call('xo.getAllObjects'), (object, id) => {
      objects.set(id, object)

      const watcher = watchers[id]
      if (watcher !== undefined) {
        watcher(object)
        delete watchers[id]
      }
    })
  }

  // TODO: integrate in xo-lib.
  waitObject(id) {
    return new Promise(resolve => {
      this._watchers[id] = resolve
    }) // FIXME: work with multiple listeners.
  }

  async getOrWaitObject(id) {
    const object = this._objects.all[id]
    if (object !== undefined) {
      return object
    }
    return this.waitObject(id)
  }

  async connect($defer, credentials = pick(config.xoConnection, 'email', 'password')) {
    await this.open()
    $defer.onFailure(() => this.close())

    await this.signIn(credentials)
    await this._fetchObjects()

    return this
  }

  async waitObjectState(id, predicate) {
    let obj = this._objects.all[id]
    if (typeof predicate !== 'function') {
      const fn = iteratee(predicate)
      predicate = () => {
        if (!fn(obj)) {
          throw new Error('retry')
        }
      }
    }

    while (true) {
      try {
        await predicate(obj)
        return obj
      } catch (_) {}
      // If failed, wait for next object state/update and retry.
      obj = await this.waitObject(id)
    }
  }

  async createTempUser(params) {
    const id = await this.call('user.create', params)
    this._tempResourceDisposers.push('user.delete', { id })
    return id
  }

  async createTempResourceSet(params) {
    const xo = this // getConnection();
    const { id } = await xo.call('resourceSet.create', params)
    this._tempResourceDisposers.push('resourceSet.delete', { id })
    return id
  }

  async getUser(id) {
    return find(await super.call('user.getAll'), { id })
  }

  async createTempJob(params) {
    const id = await this.call('job.create', { job: params })
    this._tempResourceDisposers.push('job.delete', { id })
    return id
  }

  async createTempBackupNgJob(params) {
    // mutate and inject default values
    defaultsDeep(params, {
      mode: 'full',
      name: getDefaultName(),
      settings: {
        '': {
          // it must be enabled because the XAPI might be not able to coalesce VDIs
          // as fast as the tests run
          //
          // see https://xen-orchestra.com/docs/backup_troubleshooting.html#vdi-chain-protection
          bypassVdiChainsCheck: true,

          // it must be 'never' to avoid race conditions with the plugin `backup-reports`
          reportWhen: 'never',
        },
      },
    })
    const id = await this.call('backupNg.createJob', params)
    this._tempResourceDisposers.push('backupNg.deleteJob', { id })
    return this.call('backupNg.getJob', { id })
  }

  async createTempNetwork(params) {
    const id = await this.call('network.create', {
      name: 'XO Test',
      pool: config.pools.default,
      ...params,
    })
    this._tempResourceDisposers.push('network.delete', { id })
    return this.getOrWaitObject(id)
  }

  async createTempVm(params) {
    const id = await this.call('vm.create', {
      name_label: getDefaultName(),
      template: config.templates.templateWithoutDisks,
      ...params,
    })
    this._tempResourceDisposers.push('vm.delete', { id })
    return this.waitObjectState(id, vm => {
      if (vm.type !== 'VM') throw new Error('retry')
    })
  }

  async cloneTempVm(id) {
    const clonedVmId = await this.call('vm.clone', {
      full_copy: false,
      id,
      name: getDefaultName(),
    })
    this._durableResourceDisposers.push('vm.delete', { id: clonedVmId })
    return this.getOrWaitObject(clonedVmId)
  }

  async startTempVm(id, params, withXenTools = false) {
    await this.call('vm.start', { id, ...params })
    this._tempResourceDisposers.push('vm.stop', { id, force: true })
    return this.waitObjectState(id, vm => {
      if (vm.power_state !== 'Running' || (withXenTools && vm.xenTools === false)) {
        throw new Error('retry')
      }
    })
  }

  async createTempRemote(params) {
    const remote = await this.call('remote.create', params)
    this._tempResourceDisposers.push('remote.delete', { id: remote.id })
    return remote
  }

  async createTempServer(params) {
    const servers = await this.call('server.getAll')
    const server = servers.find(server => server.host === params.host)
    if (server !== undefined) {
      if (server.status === 'disconnected') {
        await this.call('server.enable', { id: server.id })
        this._durableResourceDisposers.push('server.disable', { id: server.id })
        await fromEvent(this._objects, 'finish')
      }
      return
    }

    const id = await this.call('server.add', {
      ...params,
      allowUnauthorized: true,
      autoConnect: false,
    })
    this._durableResourceDisposers.push('server.remove', { id })
    await this.call('server.enable', { id })
    await fromEvent(this._objects, 'finish')
  }

  async getSchedule(predicate) {
    return find(await this.call('schedule.getAll'), predicate)
  }

  async runBackupJob(jobId, scheduleId, { remotes, nExecutions = 1 }) {
    const xo = this // getConnection();
    for (let i = 0; i < nExecutions; i++) {
      await xo.call('backupNg.runJob', { id: jobId, schedule: scheduleId })
    }
    const backups = {}
    if (remotes !== undefined) {
      const backupsByRemote = await xo.call('backupNg.listVmBackups', {
        remotes,
      })
      forOwn(backupsByRemote, (backupsByVm, remoteId) => {
        backups[remoteId] = []
        forOwn(backupsByVm, vmBackups => {
          vmBackups.forEach(({ jobId: backupJobId, scheduleId: backupScheduleId, id }) => {
            if (jobId === backupJobId && scheduleId === backupScheduleId) {
              this._tempResourceDisposers.push('backupNg.deleteVmBackup', {
                id,
              })
              backups[remoteId].push(id)
            }
          })
        })
      })
    }

    forOwn(this.objects.all, (obj, id) => {
      if (
        obj.other !== undefined &&
        obj.other['xo:backup:job'] === jobId &&
        obj.other['xo:backup:schedule'] === scheduleId
      ) {
        this._tempResourceDisposers.push('vm.delete', {
          id,
        })
      }
    })
    return backups
  }

  getBackupLogs(filter) {
    return this.call('backupNg.getLogs', { _forceRefresh: true, ...filter })
  }

  async _cleanDisposers(disposers) {
    for (let n = disposers.length - 1; n > 0; ) {
      const params = disposers[n--]
      const method = disposers[n--]
      await this.call(method, params).catch(error => {
        console.warn('deleteTempResources', method, params, error)
      })
    }
    disposers.length = 0
  }

  async deleteTempResources() {
    await this._cleanDisposers(this._tempResourceDisposers)
  }

  async deleteDurableResources() {
    await this._cleanDisposers(this._durableResourceDisposers)
  }
}

const getConnection = credentials => {
  const xo = new XoConnection({ url: config.xoConnection.url })
  return xo.connect(credentials)
}

/*
before(async () => {
  console.log('before xoconnection')
  xo = new XoConnection({ url: config.xoConnection.url })
  console.log('set')
  // TOFIX: stop tests if the connection is not established properly and show the error
  await getConnection()
  console.log('connected')
})
after(async () => {
  console.log('after xoconnection')
  await xo.deleteDurableResources()
  await xo.close()
})
afterEach(async () => {
  console.log('afterEach xoconnection')
  jest.setTimeout(parseDuration(config.deleteTempResourcesTimeout))

  await xo.deleteTempResources()
})
*/

export const testConnection = ({ credentials }) => getConnection(credentials).then(connection => connection.close())

export const testWithOtherConnection = defer(async ($defer, credentials, functionToExecute) => {
  const xoUser = await getConnection(credentials)
  $defer(() => xoUser.close())
  await functionToExecute(xoUser)
})

decorateClass(XoConnection, {
  connect: defer,
})
