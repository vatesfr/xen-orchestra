import angular from 'angular'
import assign from 'lodash.assign'
import cloneDeep from 'lodash.clonedeep'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import includes from 'lodash.includes'
import trim from 'lodash.trim'
import uiRouter from 'angular-ui-router'
import uiBootstrap from 'angular-ui-bootstrap'
import Bluebird from 'bluebird'
Bluebird.longStackTraces()

import view from './view'
import arrayInputView from './array-input-view'
import objectInputView from './object-input-view'

// ====================================================================

const JOB_KEY = 'genericTask'

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

export default angular.module('xoWebApp.taskscheduler.job', [
  uiRouter,
  uiBootstrap
])
.config(function ($stateProvider) {
  $stateProvider.state('taskscheduler.job', {
    url: '/job',
    controller: 'JobCtrl as ctrl',
    template: view
  })
})

.controller('JobCtrl', function (xo, xoApi, notify) {
  this.scheduleApi = {}
  this.formData = {}
  this.ready = false

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
      let [group, command] = method.split('.')
      actions.push({
        method,
        group,
        command,
        info: response[method]
      })
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
  getReady()

  const saveNew = (name, action, data) => {
    const items = []

    forEach(action.info.params, (name, param) => {
      if (Array.isArray(data[name]) && getType(param) !== 'array') {
        items.push({
          type: 'set',
          values: data[name]
        })
        delete data[name]
      }
    })

    if (Object.keys(data).length) {
      items.push({
        type: 'set',
        values: [data]
      })
    }

    const job = {
      type: 'call',
      name,
      key: JOB_KEY,
      method: action.method,
      paramsVector: {
        type: 'crossProduct',
        items
      }
    }
    return xo.job.create(job)
  }

  const save = (id, name, action, data) => {
    const items = []

    forEach(action.info.params, (name, param) => {
      if (Array.isArray(data[name]) && getType(param) !== 'array') {
        const values = []
        forEach(data[name], value => {
          values.push({[name]: value})
        })
        items.push({
          type: 'set',
          values: values
        })
        delete data[name]
      }
    })

    if (Object.keys(data).length) {
      items.push({
        type: 'set',
        values: [data]
      })
    }

    const job = this.jobs[id]
    job.name = name
    job.method = action.method
    job.paramsVector = {
      type: 'crossProduct',
      items
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
              assign(data, item.values.pop())
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
})

.directive('arrayInput', function ($compile) {
  return {
    restrict: 'E',
    scope: {
      model: '=',
      items: '='
    },
    controller: 'ArrayInput as ctrl',
    bindToController: true,
    link: function (scope, element, attrs) {
      const updateElement = () => {
        if (scope.ctrl.items) {
          element.append(arrayInputView)
        }
        $compile(element.contents())(scope)
      }

      updateElement()
    }
  }
})

.controller('ArrayInput', function ($scope) {
  const init = () => {
    if (this.model === undefined || this.model === null) {
      this.model = []
    }
  }
  init()
  if (!Array.isArray(this.model)) {
    throw new Error('arrayInput directive model must be an array')
  }

  $scope.$watch(() => this.model, init)

  this.add = value => {
    const type = getType(this.items)
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

  this.remove = (index) => {
    this.model.splice(index, 1)
  }

  this.getType = getType
})

.directive('objectInput', function ($compile) {
  return {
    restrict: 'E',
    scope: {
      model: '=',
      properties: '=',
      required: '=',
      form: '='
    },
    controller: 'ObjectInput as ctrl',
    bindToController: true,
    link: function (scope, element, attrs) {
      const updateElement = () => {
        if (scope.ctrl.properties) {
          element.append(objectInputView)
        }
        $compile(element.contents())(scope)
      }

      updateElement()
    }
  }
})

.controller('ObjectInput', function ($scope) {
  const init = () => {
    if (this.model === undefined || this.model === null) {
      this.model = {
        __use: this.required
      }
    }
    if (typeof this.model !== 'object' || Array.isArray(this.model)) {
      throw new Error('objectInput directive model must be a plain object')
    }
    const use = this.model.__use
    delete this.model.__use
    this.model.__use = Object.keys(this.model).length > 0 || use
    forEach(this.properties, (property, key) => {
      if (getType(property) === 'boolean') {
        this.model[key] = Boolean(this.model[key])
      }
    })
  }
  init()

  $scope.$watch(() => this.model, init)

  this.getType = getType
  this.isRequired = isRequired
})

// A module exports its name.
.name
