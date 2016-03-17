import angular from 'angular'
import assign from 'lodash.assign'
import cloneDeep from 'lodash.clonedeep'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import includes from 'lodash.includes'
import jsonSchema from 'json-schema'
import mapValues from 'lodash.mapvalues'
import trim from 'lodash.trim'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'
import Bluebird from 'bluebird'
Bluebird.longStackTraces()

import view from './view'

// ====================================================================

const JOB_KEY = 'genericTask'

const jobCompliantMethods = [
  'acl.add',
  'acl.remove',
  'host.detach',
  'host.disable',
  'host.enable',
  'host.installAllPatches',
  'host.restart',
  'host.restartAgent',
  'host.set',
  'host.start',
  'host.stop',
  'job.runSequence',
  'vm.attachDisk',
  'vm.backup',
  'vm.clone',
  'vm.convert',
  'vm.copy',
  'vm.creatInterface',
  'vm.delete',
  'vm.migrate',
  'vm.migrate',
  'vm.restart',
  'vm.resume',
  'vm.revert',
  'vm.rollingBackup',
  'vm.rollingDrCopy',
  'vm.rollingSnapshot',
  'vm.set',
  'vm.setBootOrder',
  'vm.snapshot',
  'vm.start',
  'vm.stop',
  'vm.suspend'
]

const getType = function (param) {
  if (!param) {
    return
  }
  if (Array.isArray(param.type)) {
    if (includes(param.type, 'integer')) {
      return 'integer'
    } else if (includes(param.type, 'number')) {
      return 'number'
    } else {
      return 'string'
    }
  }
  return param.type
}

/**
 * Takes care of unfilled not-required data and unwanted white-spaces
 */
const cleanUpData = function (data) {
  if (!data) {
    return
  }

  function sanitizeItem (item) {
    if (typeof item === 'string') {
      item = trim(item)
    }
    return item
  }

  function keepItem (item) {
    if ((item === undefined) || (item === null) || (item === '') || (Array.isArray(item) && item.length === 0) || item.__use === false) {
      return false
    } else {
      return true
    }
  }

  forEach(data, (item, key) => {
    item = sanitizeItem(item)
    data[key] = item
    if (!keepItem(item)) {
      delete data[key]
    } else if (typeof item === 'object') {
      cleanUpData(item)
    }
  })

  delete data.__use

  return data
}

/**
 * Tries extracting XO Object targeted property
 */
const reduceXoObject = function (value, propertyName = 'id') {
  return value && value[propertyName] || value
}

/**
 * Adapts all data "arrayed" by UI-multiple-selectors to job's cross-product trick
 */
const dataToParamVectorItems = function (params, data) {
  const items = []
  forEach(params, (param, name) => {
    if (Array.isArray(data[name]) && getType(param) !== 'array') {
      const values = []
      if (data[name].length === 1) { // One value, no need to engage cross-product
        data[name] = data[name].pop()
      } else {
        forEach(data[name], value => {
          values.push({[name]: reduceXoObject(value, name)})
        })
        if (values.length) { // No values at all
          items.push({
            type: 'set',
            values
          })
        }
        delete data[name]
      }
    }
  })
  if (Object.keys(data).length) {
    items.push({
      type: 'set',
      values: [mapValues(data, reduceXoObject)]
    })
  }
  return items
}

export default angular.module('xoWebApp.taskscheduler.job', [
  jsonSchema,
  uiRouter,
  uiBootstrap
])
.config(function ($stateProvider) {
  $stateProvider.state('taskscheduler.job', {
    url: '/job/:id',
    controller: 'JobCtrl as ctrl',
    template: view
  })
})

.controller('JobCtrl', function ($scope, xo, xoApi, notify, $stateParams) {
  this.scheduleApi = {}
  this.formData = {}
  this.running = {}
  this.ready = false
  let comesForEditing = $stateParams.id

  this.resetData = () => {
    this.formData = {}
  }
  this.resetForm = () => {
    this.resetData()
    this.editedJobId = undefined
    this.jobName = undefined
    this.selectedAction = undefined
  }
  this.resetForm()

  const loadActions = () => xoApi.call('system.getMethodsInfo')
  .then(response => {
    const actions = []

    for (let method in response) {
      if (includes(jobCompliantMethods, method)) {
        let [group, command] = method.split('.')
        const properties = response[method].params

        response[method].properties = properties
        response[method].type = 'object'
        delete response[method].params

        for (const key in properties) {
          const property = properties[key]
          const type = getType(property)

          if (type === 'string') {
            if (group === 'acl') {
              if (key === 'object') {
                property.$type = 'XoObject'
              } else if (key === 'action') {
                property.$type = 'XoRole'
              } else if (key === 'subject') {
                property.$type = 'XoEntity'
              }
            } else if (group === 'host' && key === 'id') {
              property.$type = 'Host'
            } else if (group === 'vm' && key === 'id') {
              property.$type = 'Vm'
            } else {
              if (includes(['pool', 'pool_id', 'target_pool_id'], key)) {
                property.$type = 'Pool'
              } else if (includes(['sr', 'sr_id', 'target_sr_id'], key)) {
                property.$type = 'Sr'
              } else if (includes(['host', 'host_id', 'target_host_id'], key)) {
                property.$type = 'Host'
              } else if (includes(['vm'], key)) {
                property.$type = 'Vm'
              }
            }
          }
        }

        actions.push({
          method,
          group,
          command,
          info: response[method]
        })
      }
    }

    this.actions = actions
    this.ready = true
  })

  const loadJobs = () => xo.job.getAll().then(jobs => {
    const j = {}
    forEach(jobs, job => {
      if (job.key === JOB_KEY) {
        j[job.id] = job
      }
    })
    this.jobs = j
  })

  const refresh = () => loadJobs()
  const getReady = () => loadActions().then(refresh).then(() => this.ready = true)
  getReady().then(() => {
    if (comesForEditing) {
      this.edit(comesForEditing)
      comesForEditing = undefined
    }
  })

  const saveNew = (name, action, data) => {
    const job = {
      type: 'call',
      name,
      key: JOB_KEY,
      method: action.method,
      paramsVector: {
        type: 'crossProduct',
        items: dataToParamVectorItems(action.info.properties, data)
      }
    }
    return xo.job.create(job)
  }

  const save = (id, name, action, data) => {
    const job = this.jobs[id]
    job.name = name
    job.method = action.method
    job.paramsVector = {
      type: 'crossProduct',
      items: dataToParamVectorItems(action.info.properties, data)
    }
    return xo.job.set(job)
  }

  this.save = (id, name, action, data) => {
    const dataClone = cleanUpData(cloneDeep(data))
    const saved = (id !== undefined) ? save(id, name, action, dataClone) : saveNew(name, action, dataClone)
    return saved
    .then(() => this.resetForm())
    .finally(refresh)
  }

  this.edit = id => {
    this.resetForm()
    try {
      const job = this.jobs[id]
      if (job) {
        this.editedJobId = id
        this.jobName = job.name
        this.selectedAction = find(this.actions, action => action.method === job.method)
        const data = {}
        const paramsVector = job.paramsVector
        if (paramsVector) {
          if (paramsVector.type !== 'crossProduct') {
            throw new Error(`Unknown parameter-vector type ${paramsVector.type}`)
          }
          forEach(paramsVector.items, item => {
            if (item.type !== 'set') {
              throw new Error(`Unknown parameter-vector item type ${item.type}`)
            }
            if (item.values.length === 1) {
              assign(data, item.values[0])
            } else {
              forEach(item.values, valueItem => {
                forEach(valueItem, (value, key) => {
                  if (data[key] === undefined) {
                    data[key] = []
                  }
                  data[key].push(value)
                })
              })
            }
          })
        }
        this.formData = data
      }
    } catch (error) {
      this.resetForm()
      notify.error({
        title: 'Unhandled Job',
        message: error.message
      })
    }
  }

  this.delete = id => xo.job.delete(id).then(refresh).then(() => {
    if (id === this.editedJobId) {
      this.resetForm()
    }
  })

  this.run = id => {
    this.running[id] = true
    notify.info({
      title: 'Run Job',
      message: 'One shot running started. See overview for logs.'
    })
    return xo.job.runSequence([id]).finally(() => delete this.running[id])
  }
})
// A module exports its name.
.name
