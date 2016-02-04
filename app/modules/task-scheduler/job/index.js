import angular from 'angular'
import assign from 'lodash.assign'
import cloneDeep from 'lodash.clonedeep'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import includes from 'lodash.includes'
import map from 'lodash.map'
import mapValues from 'lodash.mapvalues'
import remove from 'lodash.remove'
import trim from 'lodash.trim'
import uiRouter from 'angular-ui-router'
import uiBootstrap from 'angular-ui-bootstrap'
import Bluebird from 'bluebird'
Bluebird.longStackTraces()

import arrayInputView from './array-input-view'
import booleanInputView from './boolean-input-view'
import hostInputView from './host-input-view'
import integerInputView from './integer-input-view'
import numberInputView from './number-input-view'
import objectInputView from './object-input-view'
import poolInputView from './pool-input-view'
import srInputView from './sr-input-view'
import stringInputView from './string-input-view'
import view from './view'
import vmInputView from './vm-input-view'
import xoEntityInputView from './xo-entity-input-view'
import xoObjectInputView from './xo-object-input-view'
import xoRoleInputView from './xo-role-input-view'

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

const isRequired = function (param) {
  if (!param) {
    return
  }
  return (!param.optional && !(includes(['boolean', 'array'], getType(param))))
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

const actionGroup = {
  group: undefined,
  get: function () {
    return this.group
  },
  set: function (group) {
    this.group = group
  }
}

const _initXoObjectInput = function () {
  if (this.model === undefined) {
    this.model = []
  }
  if (!Array.isArray(this.model)) {
    this.model = [this.model]
  }
  this.intraModel = map(this.model, value => find(this.objects, object => object.id === value) || value)
}

const _exportRemove = function (removedItem) {
  remove(this.model, item => item === reduceXoObject(removedItem))
}

const _exportSelect = function (addedItem) {
  const addOn = reduceXoObject(addedItem)
  if (!find(this.model, item => item === addOn)) {
    this.model.push(addOn)
  }
}

export default angular.module('xoWebApp.taskscheduler.job', [
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

  $scope.$watch(() => this.selectedAction, newAction => actionGroup.set(newAction && newAction.group))

  const loadActions = () => xoApi.call('system.getMethodsInfo')
  .then(response => {
    const actions = []

    for (let method in response) {
      if (includes(jobCompliantMethods, method)) {
        let [group, command] = method.split('.')
        response[method].properties = response[method].params
        response[method].type = 'object'
        delete response[method].params
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

.directive('stringInput', function () {
  return {
    restrict: 'E',
    scope: {
      model: '=',
      form: '=',
      key: '=',
      property: '='
    },
    bindToController: true,
    controller: function () {
      this.isRequired = () => isRequired(this.property)
      this.active = () => getType(this.property) === 'string' && !includes(['id', 'host', 'host_id', 'target_host_id', 'sr', 'target_sr_id', 'vm', 'pool', 'subject', 'object', 'action'], this.key)
    },
    controllerAs: 'ctrl',
    template: stringInputView
  }
})

.directive('booleanInput', function () {
  return {
    restrict: 'E',
    scope: {
      model: '=',
      form: '=',
      key: '=',
      property: '='
    },
    bindToController: true,
    controller: function () {
      this.isRequired = () => isRequired(this.property)
      this.active = () => getType(this.property) === 'boolean'
    },
    controllerAs: 'ctrl',
    template: booleanInputView
  }
})

.directive('integerInput', function () {
  return {
    restrict: 'E',
    scope: {
      model: '=',
      form: '=',
      key: '=',
      property: '='
    },
    bindToController: true,
    controller: function () {
      this.isRequired = () => isRequired(this.property)
      this.active = () => getType(this.property) === 'integer'
    },
    controllerAs: 'ctrl',
    template: integerInputView
  }
})

.directive('numberInput', function () {
  return {
    restrict: 'E',
    scope: {
      model: '=',
      form: '=',
      key: '=',
      property: '='
    },
    bindToController: true,
    controller: function () {
      this.isRequired = () => isRequired(this.property)
      this.active = () => getType(this.property) === 'number'
    },
    controllerAs: 'ctrl',
    template: numberInputView
  }
})

.directive('arrayInput', function ($compile) {
  return {
    restrict: 'E',
    scope: {
      model: '=',
      form: '=',
      key: '=',
      property: '='
    },
    controller: 'ArrayInput as ctrl',
    bindToController: true,
    link: function (scope, element, attrs) {
      const updateElement = () => {
        if (scope.ctrl.property.items) {
          element.append(arrayInputView)
        }
        $compile(element.contents())(scope)
      }

      updateElement()
    }
  }
})
.controller('ArrayInput', function ($scope) {
  this.isRequired = () => false
  this.getType = getType
  this.active = () => getType(this.property) === 'array'
  this.add = value => {
    const type = getType(this.property.items)
    switch (type) {
      case 'boolean':
        value = Boolean(value)
        break
      case 'string':
        value = trim(value)
        break
    }
    this.model.push(value)
  }
  this.remove = index => this.model.splice(index, 1)
  const init = () => {
    if (this.model === undefined || this.model === null) {
      this.model = []
    }
  }

  if (this.active()) {
    init()
    if (!Array.isArray(this.model)) {
      throw new Error('arrayInput directive model must be an array')
    }
    $scope.$watch(() => this.model, init)
  }
})

.directive('objectInput', function ($compile) {
  return {
    restrict: 'E',
    scope: {
      model: '=',
      form: '=',
      key: '=',
      property: '='
    },
    controller: 'ObjectInput as ctrl',
    bindToController: true,
    link: function (scope, element, attrs) {
      const updateElement = () => {
        if (scope.ctrl.property.properties) {
          element.append(objectInputView)
        }
        $compile(element.contents())(scope)
      }

      updateElement()
    }
  }
})
.controller('ObjectInput', function ($scope) {
  this.isRequired = () => isRequired(this.property)
  this.active = () => getType(this.property) === 'object' && (this.key !== 'object' || actionGroup.get() !== 'acl')
  const init = () => {
    if (this.model === undefined || this.model === null) {
      this.model = {
        __use: this.isRequired()
      }
    }
    if (typeof this.model !== 'object' || Array.isArray(this.model)) {
      throw new Error('objectInput directive model must be a plain object')
    }
    const use = this.model.__use
    delete this.model.__use
    this.model.__use = Object.keys(this.model).length > 0 || use
    forEach(this.property.properties, (property, key) => {
      if (getType(property) === 'boolean') {
        this.model[key] = Boolean(this.model[key])
      }
    })
  }

  if (this.active()) {
    init()
    $scope.$watch(() => this.model, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        init()
      }
    })
  }
})

.directive('vmInput', function () {
  return {
    restrict: 'E',
    scope: {
      form: '=',
      key: '=',
      property: '=',
      model: '='
    },
    controller: 'VmInput as ctrl',
    bindToController: true,
    template: vmInputView
  }
})
.controller('VmInput', function ($scope, xoApi) {
  this.objects = xoApi.all
  this.isRequired = () => isRequired(this.property)
  this.active = () => getType(this.property) === 'string' && (this.key === 'vm' || (actionGroup.get() === 'vm' && this.key === 'id'))

  this.init = _initXoObjectInput
  this.exportRemove = _exportRemove
  this.exportSelect = _exportSelect

  if (this.active()) {
    this.init()
    $scope.$watch(() => this.model, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        this.init()
      }
    })
  }
})

.directive('hostInput', function () {
  return {
    restrict: 'E',
    scope: {
      form: '=',
      key: '=',
      property: '=',
      model: '='
    },
    controller: 'HostInput as ctrl',
    bindToController: true,
    template: hostInputView
  }
})
.controller('HostInput', function ($scope, xoApi) {
  this.objects = xoApi.all
  this.isRequired = () => isRequired(this.property)
  this.active = () => getType(this.property) === 'string' && (includes(['host', 'host_id', 'target_host_id'], this.key) || (actionGroup.get() === 'host' && this.key === 'id'))

  this.init = _initXoObjectInput
  this.exportRemove = _exportRemove
  this.exportSelect = _exportSelect

  if (this.active()) {
    this.init()
    $scope.$watch(() => this.model, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        this.init()
      }
    })
  }
})

.directive('srInput', function () {
  return {
    restrict: 'E',
    scope: {
      form: '=',
      key: '=',
      property: '=',
      model: '='
    },
    controller: 'SrInput as ctrl',
    bindToController: true,
    template: srInputView
  }
})
.controller('SrInput', function ($scope, xoApi) {
  this.objects = xoApi.all
  this.isRequired = () => isRequired(this.property)
  this.active = () => getType(this.property) === 'string' && includes(['sr', 'sr_id', 'target_sr_id'], this.key)

  this.init = _initXoObjectInput
  this.exportRemove = _exportRemove
  this.exportSelect = _exportSelect

  if (this.active()) {
    this.init()
    $scope.$watch(() => this.model, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        this.init()
      }
    })
  }
})

.directive('poolInput', function () {
  return {
    restrict: 'E',
    scope: {
      form: '=',
      key: '=',
      property: '=',
      model: '='
    },
    controller: 'PoolInput as ctrl',
    bindToController: true,
    template: poolInputView
  }
})
.controller('PoolInput', function ($scope, xoApi) {
  this.objects = xoApi.all
  this.isRequired = () => isRequired(this.property)
  this.active = () => getType(this.property) === 'string' && includes(['pool', 'pool_id', 'target_pool_id'], this.key)

  this.init = _initXoObjectInput
  this.exportRemove = _exportRemove
  this.exportSelect = _exportSelect

  if (this.active()) {
    this.init()
    $scope.$watch(() => this.model, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        this.init()
      }
    })
  }
})

.directive('xoEntityInput', function () {
  return {
    restrict: 'E',
    scope: {
      form: '=',
      key: '=',
      property: '=',
      model: '='
    },
    controller: 'XoEntityInput as ctrl',
    bindToController: true,
    template: xoEntityInputView
  }
})
.controller('XoEntityInput', function ($scope, xo) {
  this.ready = false
  this.isRequired = () => isRequired(this.property)
  this.active = () => this.ready && getType(this.property) === 'string' && this.key === 'subject' && actionGroup.get() === 'acl'

  this.init = _initXoObjectInput
  this.exportRemove = _exportRemove
  this.exportSelect = _exportSelect

  Bluebird.props({
    users: xo.user.getAll(),
    groups: xo.group.getAll()
  })
  .then(p => {
    this.objects = p.users.concat(p.groups)
    this.ready = true
    if (this.active()) {
      this.init()
      $scope.$watch(() => this.model, (newVal, oldVal) => {
        if (newVal !== oldVal) {
          this.init()
        }
      })
    }
  })
})

.directive('xoRoleInput', function () {
  return {
    restrict: 'E',
    scope: {
      form: '=',
      key: '=',
      property: '=',
      model: '='
    },
    controller: 'XoRoleInput as ctrl',
    bindToController: true,
    template: xoRoleInputView
  }
})
.controller('XoRoleInput', function ($scope, xo) {
  this.ready = false
  this.isRequired = () => isRequired(this.property)
  this.active = () => this.ready && getType(this.property) === 'string' && this.key === 'action' && actionGroup.get() === 'acl'

  this.init = _initXoObjectInput
  this.exportRemove = _exportRemove
  this.exportSelect = _exportSelect

  xo.role.getAll()
  .then(roles => {
    this.objects = roles
    this.ready = true
    if (this.active()) {
      this.init()
      $scope.$watch(() => this.model, (newVal, oldVal) => {
        if (newVal !== oldVal) {
          this.init()
        }
      })
    }
  })
})

.directive('xoObjectInput', function () {
  return {
    restrict: 'E',
    scope: {
      form: '=',
      key: '=',
      property: '=',
      model: '='
    },
    controller: 'XoObjectInput as ctrl',
    bindToController: true,
    template: xoObjectInputView
  }
})
.controller('XoObjectInput', function ($scope, xoApi, filterFilter, selectHighLevelFilter) {
  const HIGH_LEVEL_OBJECTS = {
    pool: true,
    host: true,
    VM: true,
    SR: true,
    network: true
  }
  this.types = Object.keys(HIGH_LEVEL_OBJECTS)
  this.objects = xoApi.all

  this.isRequired = () => isRequired(this.property)
  this.active = () => getType(this.property) === 'string' && this.key === 'object' && actionGroup.get() === 'acl'
  this.toggleType = (toggle, type) => {
    const selectedObjects = this.intraModel && this.intraModel.slice() || []
    if (toggle) {
      const objects = filterFilter(selectHighLevelFilter(this.objects), {type})
      forEach(objects, object => { selectedObjects.indexOf(object) === -1 && selectedObjects.push(object) })
      this.intraModel = selectedObjects
    } else {
      const keptObjects = []
      for (let index in selectedObjects) {
        const object = selectedObjects[index]
        if (object.type !== type) {
          keptObjects.push(object)
        }
      }
      this.intraModel = keptObjects
    }
    this.model.length = 0
    forEach(this.intraModel, item => this.model.push(reduceXoObject(item)))
  }

  this.init = _initXoObjectInput
  this.exportRemove = _exportRemove
  this.exportSelect = _exportSelect

  if (this.active()) {
    this.init()
    $scope.$watch(() => this.model, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        this.init()
      }
    })
  }
})
// A module exports its name.
.name
