import escapeRegExp from 'lodash/escapeRegExp'
import every from 'lodash/every'
import forEach from 'lodash/forEach'
import getStream from 'get-stream'
import humanFormat from 'human-format'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import join from 'lodash/join'
import keys from 'lodash/keys'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import React from 'react'
import ReadableStream from 'readable-stream'
import replace from 'lodash/replace'
import startsWith from 'lodash/startsWith'
import { connect } from 'react-redux'

import _ from './intl'
import * as actions from './store/actions'
import BaseComponent from './base-component'
import invoke from './invoke'
import store from './store'
import { getObject } from './selectors'

export const EMPTY_ARRAY = Object.freeze([ ])
export const EMPTY_OBJECT = Object.freeze({ })

// ===================================================================

export const ensureArray = (value) => {
  if (value === undefined) {
    return []
  }

  return Array.isArray(value) ? value : [ value ]
}

export const propsEqual = (o1, o2, props) => {
  props = ensureArray(props)

  for (const prop of props) {
    if (o1[prop] !== o2[prop]) {
      return false
    }
  }

  return true
}

// ===================================================================

// `subscriptions` can be a function if we want to ensure that the subscription
// callbacks have been correctly initialized when there are circular dependencies
export const addSubscriptions = subscriptions => Component => {
  class SubscriptionWrapper extends BaseComponent {
    constructor () {
      super()

      this._unsubscribes = null
    }

    componentWillMount () {
      this._unsubscribes = map(isFunction(subscriptions) ? subscriptions() : subscriptions, (subscribe, prop) =>
        subscribe(value => this._setState({ [prop]: value }))
      )
    }

    componentDidMount () {
      this._setState = this.setState
    }

    componentWillUnmount () {
      forEach(this._unsubscribes, unsubscribe => unsubscribe())
      this._unsubscribes = null
      delete this._setState
    }

    _setState (nextState) {
      this.state = { ...this.state, nextState }
    }

    render () {
      return <Component
        {...this.props}
        {...this.state}
      />
    }
  }

  return SubscriptionWrapper
}

// -------------------------------------------------------------------

export const checkPropsState = (propsNames, stateNames) => Component => {
  const nProps = propsNames && propsNames.length
  const nState = stateNames && stateNames.length

  Component.prototype.shouldComponentUpdate = (newProps, newState) => {
    const { props, state } = this

    for (let i = 0; i < nProps; ++i) {
      const name = propsNames[i]
      if (newProps[name] !== props[name]) {
        return true
      }
    }

    for (let i = 0; i < nState; ++i) {
      const name = stateNames[i]
      if (newState[name] !== state[name]) {
        return true
      }
    }
  }

  return Component
}

// -------------------------------------------------------------------

const _normalizeMapStateToProps = mapper => {
  if (isFunction(mapper)) {
    let factoryOrMapper = (state, props) => {
      const result = mapper(state, props)

      // Properly handles factory pattern.
      if (isFunction(result)) {
        mapper = result
        return factoryOrMapper
      }

      if (isPlainObject(result)) {
        if (isEmpty(result)) {
          // Nothing can be determined, wait for it.
          return result
        }

        if (every(result, isFunction)) {
          indirection = (state, props) => mapValues(result, selector => selector(state, props))
          return indirection(state, props)
        }
      }

      indirection = mapper
      return result
    }

    let indirection = factoryOrMapper
    return (state, props) => indirection(state, props)
  }

  mapper = mapValues(mapper, _normalizeMapStateToProps)
  return (state, props) => mapValues(mapper, fn => fn(state, props))
}

export const connectStore = (mapStateToProps, opts = {}) => {
  const connector = connect(
    _normalizeMapStateToProps(mapStateToProps),
    actions,
    undefined,
    opts
  )

  return Component => {
    const ConnectedComponent = connector(Component)

    if (opts.withRef && 'value' in Component.prototype) {
      Object.defineProperty(ConnectedComponent.prototype, 'value', {
        configurable: true,
        get () {
          return this.getWrappedInstance().value
        },
        set (value) {
          this.getWrappedInstance().value = value
        }
      })
    }

    return ConnectedComponent
  }
}

// -------------------------------------------------------------------

export { default as Debug } from './debug'

// -------------------------------------------------------------------

// Returns the first defined (non-undefined) value.
export const firstDefined = function () {
  const n = arguments.length
  for (let i = 0; i < n; ++i) {
    const arg = arguments[i]
    if (arg !== undefined) {
      return arg
    }
  }
}

// -------------------------------------------------------------------

// Returns the current XOA Plan or the Plan name if number given
export const getXoaPlan = plan => {
  switch (plan || +process.env.XOA_PLAN) {
    case 1:
      return 'Free'
    case 2:
      return 'Starter'
    case 3:
      return 'Enterprise'
    case 4:
      return 'Premium'
    case 5:
      return 'Community'
  }
  return 'Unknown'
}

// -------------------------------------------------------------------

export const mapPlus = (collection, cb) => {
  const result = []
  const push = ::result.push
  forEach(collection, (value, index) => cb(value, push, index))
  return result
}

// -------------------------------------------------------------------

export const noop = () => {}

// -------------------------------------------------------------------

export const osFamily = invoke({
  centos: [ 'centos' ],
  debian: [ 'debian' ],
  docker: [ 'coreos' ],
  fedora: [ 'fedora' ],
  freebsd: [ 'freebsd' ],
  gentoo: [ 'gentoo' ],
  'linux-mint': [ 'linux-mint' ],
  netbsd: [ 'netbsd' ],
  oracle: [ 'oracle' ],
  osx: [ 'osx' ],
  redhat: [ 'redhat', 'rhel' ],
  solaris: [ 'solaris' ],
  suse: [ 'sles', 'suse' ],
  ubuntu: [ 'ubuntu' ],
  windows: [ 'windows' ]
}, osByFamily => {
  const osToFamily = Object.create(null)
  forEach(osByFamily, (list, family) => {
    forEach(list, os => {
      osToFamily[os] = family
    })
  })

  return osName => osName && osToFamily[osName.toLowerCase()]
})

// -------------------------------------------------------------------

export const formatSize = bytes => humanFormat(bytes, { scale: 'binary', unit: 'B' })

export const formatSizeRaw = bytes => humanFormat.raw(bytes, { scale: 'binary', unit: 'B' })

export const formatSpeed = (bytes, milliseconds) => humanFormat(
  bytes * 1e3 / milliseconds,
  { scale: 'binary', unit: 'B/s' }
)

export const parseSize = size => {
  let bytes = humanFormat.parse.raw(size, { scale: 'binary' })
  if (bytes.unit && bytes.unit !== 'B') {
    bytes = humanFormat.parse.raw(size)

    if (bytes.unit && bytes.unit !== 'B') {
      throw new Error('invalid size: ' + size)
    }
  }
  return Math.floor(bytes.value * bytes.factor)
}

// -------------------------------------------------------------------

export const normalizeXenToolsStatus = status => {
  if (status === false) {
    return 'not-installed'
  }
  if (status === undefined) {
    return 'unknown'
  }
  if (status === 'up to date') {
    return 'up-to-date'
  }
  return 'out-of-date'
}

// -------------------------------------------------------------------

const _NotFound = () => <h1>{_('errorPageNotFound')}</h1>

// Decorator to declare routes on a component.
//
// TODO: add support for function childRoutes (getChildRoutes).
export const routes = (indexRoute, childRoutes) => target => {
  if (isArray(indexRoute)) {
    childRoutes = indexRoute
    indexRoute = undefined
  } else if (isFunction(indexRoute)) {
    indexRoute = {
      component: indexRoute
    }
  } else if (isString(indexRoute)) {
    indexRoute = {
      onEnter: invoke(indexRoute, pathname => (state, replace) => {
        const current = state.location.pathname
        replace((current === '/' ? '' : current) + '/' + pathname)
      })
    }
  }

  if (isPlainObject(childRoutes)) {
    childRoutes = map(childRoutes, (component, path) => {
      // The logic can be bypassed by passing a plain object.
      if (isPlainObject(component)) {
        return { ...component, path }
      }

      return { ...component.route, component, path }
    })
  }

  if (childRoutes) {
    childRoutes.push({ component: _NotFound, path: '*' })
  }

  target.route = {
    indexRoute,
    childRoutes
  }

  return target
}

// -------------------------------------------------------------------

// Creates a new function which throws an error.
//
// ```js
// promise.catch(throwFn('an error has occured'))
//
// function foo (param = throwFn('param is required')) {}
// ```
export const throwFn = error => () => {
  throw (
    isString(error)
      ? new Error(error)
      : error
  )
}

// ===================================================================

export const resolveResourceSet = resourceSet => {
  if (!resourceSet) {
    return
  }

  const { objects, ipPools, ...attrs } = resourceSet
  const resolvedObjects = {}
  const resolvedSet = {
    ...attrs,
    missingObjects: [],
    objectsByType: resolvedObjects,
    ipPools
  }
  const state = store.getState()

  forEach(objects, id => {
    const object = getObject(state, id, true) // true: useResourceSet to bypass permissions

    // Error, missing resource.
    if (!object) {
      resolvedSet.missingObjects.push(id)
      return
    }

    const { type } = object

    if (!resolvedObjects[type]) {
      resolvedObjects[type] = [ object ]
    } else {
      resolvedObjects[type].push(object)
    }
  })

  return resolvedSet
}

export const resolveResourceSets = resourceSets =>
  map(resourceSets, resolveResourceSet)

// -------------------------------------------------------------------

// Creates a string replacer based on a pattern and a list of rules
//
// ```js
// const myReplacer = buildTemplate('{name}_COPY_{name}_{id}_%', {
//   '{name}': vm => vm.name_label,
//   '{id}': vm => vm.id,
//   '%': (_, i) => i
// })
//
// const newString = myReplacer({
//   name_label: 'foo',
//   id: 42,
// }, 32)
//
// newString === 'foo_COPY_foo_42_32'
// ```
export function buildTemplate (pattern, rules) {
  const regExp = new RegExp(join(map(keys(rules), escapeRegExp), '|'), 'g')
  return (...params) => replace(pattern, regExp, match => {
    const rule = rules[match]
    return isFunction(rule) ? rule(...params) : rule
  })
}

// ===================================================================

export const streamToString = getStream

// ===================================================================

/* global FileReader */

// Creates a readable stream from a HTML file.
export const htmlFileToStream = file => {
  const reader = new FileReader()
  const stream = new ReadableStream()
  let offset = 0

  reader.onloadend = evt => {
    stream.push(evt.target.result)
  }
  reader.onerror = error => {
    stream.emit('error', error)
  }

  stream._read = function (size) {
    if (offset >= file.size) {
      stream.push(null)
    } else {
      reader.readAsBinaryString(file.slice(offset, offset + size))
      offset += size
    }
  }

  return stream
}

// ===================================================================

export const resolveId = value =>
  (value != null && typeof value === 'object' && 'id' in value)
    ? value.id
    : value

export const resolveIds = params => {
  for (const key in params) {
    const param = params[key]
    if (param != null && typeof param === 'object' && 'id' in param) {
      params[key] = param.id
    }
  }
  return params
}

// ===================================================================

const OPs = {
  '<': a => a < 0,
  '<=': a => a <= 0,
  '===': a => a === 0,
  '>': a => a > 0,
  '>=': a => a >= 0
}

const makeNiceCompare = compare => function () {
  const { length } = arguments
  if (length === 2) {
    return compare(arguments[0], arguments[1])
  }

  let i = 1
  let v1 = arguments[0]
  let op, v2
  while (i < length) {
    op = arguments[i++]
    v2 = arguments[i++]
    if (!OPs[op](compare(v1, v2))) {
      return false
    }
    v1 = v2
  }
  return true
}

export const compareVersions = makeNiceCompare((v1, v2) => {
  v1 = v1.split('.')
  v2 = v2.split('.')

  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const n1 = +v1[i] || 0
    const n2 = +v2[i] || 0

    if (n1 < n2) return -1
    if (n1 > n2) return 1
  }

  return 0
})

export const isXosanPack = ({ name }) =>
  startsWith(name, 'XOSAN')

// ===================================================================

export const getCoresPerSocketPossibilities = (maxCoresPerSocket, vCPUs) => {
  // According to : https://www.citrix.com/blogs/2014/03/11/citrix-xenserver-setting-more-than-one-vcpu-per-vm-to-improve-application-performance-and-server-consolidation-e-g-for-cad3-d-graphical-applications/
  const maxVCPUs = 16

  const options = []
  if (maxCoresPerSocket !== undefined && vCPUs !== '') {
    const ratio = vCPUs / maxVCPUs

    for (let coresPerSocket = maxCoresPerSocket; coresPerSocket >= ratio; coresPerSocket--) {
      if (vCPUs % coresPerSocket === 0) options.push(coresPerSocket)
    }
  }

  return options
}
