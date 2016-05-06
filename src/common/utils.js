import * as actions from 'store/actions'
import assign from 'lodash/assign'
import forEach from 'lodash/forEach'
import humanFormat from 'human-format'
import isArray from 'lodash/isArray'
import isFunction from 'lodash/isFunction'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import pick from 'lodash/fp/pick'
import React, { cloneElement, PropTypes } from 'react'
import { connect } from 'react-redux'

import invoke from './invoke'

// ===================================================================

export const EMPTY_OBJECT = Object.freeze({ })

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

const _bind = (fn, thisArg) => function bound () {
  return fn.apply(thisArg, arguments)
}
const _defineProperty = Object.defineProperty

export const autobind = (target, key, {
  configurable,
  enumerable,
  value: fn,
  writable
}) => ({
  configurable,
  enumerable,

  get () {
    if (this === target) {
      return fn
    }

    const bound = _bind(fn, this)

    _defineProperty(this, key, {
      configurable: true,
      enumerable: false,
      value: bound,
      writable: true
    })

    return bound
  },
  set (newValue) {
    // Cannot use assignment because it will call the setter on
    // the prototype.
    _defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      value: newValue,
      writable: true
    })
  }
})

// -------------------------------------------------------------------

export class BlockLink extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object
  };

  render () {
    const { router } = this.context
    const { children, to } = this.props

    return <div onClick={() => router.push(to)} style={{
      cursor: 'pointer'
    }}>
      {children}
    </div>
  }
}

// -------------------------------------------------------------------

const _normalizeMapStateToProps = mapper => {
  if (isFunction(mapper)) {
    return mapper
  }

  if (isArray(mapper)) {
    return pick(mapper)
  }

  mapper = mapValues(mapper, _normalizeMapStateToProps)
  return (state, props) => mapValues(mapper, fn => fn(state, props))
}

export const connectStore = (mapStateToProps, opts) => connect(
  _normalizeMapStateToProps(mapStateToProps),
  actions,
  undefined,
  opts
)

// -------------------------------------------------------------------

// Simple matcher to use in object filtering.
export const createSimpleMatcher = (pattern, valueGetter) => {
  if (!pattern) {
    return
  }

  pattern = pattern.toLowerCase()
  return item => valueGetter(item).toLowerCase().indexOf(pattern) !== -1
}

// -------------------------------------------------------------------

export const mapPlus = (collection, cb) => {
  const result = []
  const push = ::result.push
  forEach(collection, value => cb(value, push))
  return result
}

// -------------------------------------------------------------------

export const noop = () => {}

// -------------------------------------------------------------------

export const osFamily = invoke({
  linux: [
    'coreos'
  ],
  centos: [
    'centos'
  ],
  debian: [
    'debian'
  ],
  fedora: [
    'fedora'
  ],
  gentoo: [
    'gentoo'
  ],
  oracle: [
    'oracle'
  ],
  redhat: [
    'redhat',
    'rhel'
  ],
  ubuntu: [
    'ubuntu'
  ],
  solaris: [
    'solaris'
  ],
  freebsd: [
    'freebsd'
  ],
  netbsd: [
    'netbsd'
  ],
  osx: [
    'osx'
  ],
  'linux-mint': [
    'linux-mint'
  ],
  suse: [
    'sles',
    'suse'
  ],
  windows: [
    'windows'
  ]
}, osByFamily => {
  const osToFamily = Object.create(null)
  forEach(osByFamily, (list, family) => {
    forEach(list, os => {
      osToFamily[os] = family
    })
  })

  return osName => osToFamily[osName.toLowerCase()] || 'other'
})

// -------------------------------------------------------------------

// Experimental!
//
// ```js
// <If cond={user}>
//   <p>user.name</p>
//   <p>user.email</p>
// </If>
// ```
export const If = ({ cond, children }) => cond && children
  ? map(children, (child, key) => cloneElement(child, { key }))
  : null

// -------------------------------------------------------------------

export { invoke }

// -------------------------------------------------------------------

// Decorators to help declaring on React components without using the
// tedious static properties syntax.
//
// ```js
// @propTypes({
//   children: propTypes.node.isRequired
// })
// class MyComponent extends React.Component {}
// ```
export const propTypes = types => target => {
  if (target.propTypes) {
    throw new Error('refusing to override propTypes property')
  }

  target.propTypes = types

  return target
}
assign(propTypes, PropTypes)

// -------------------------------------------------------------------

export const formatSize = bytes => humanFormat(bytes, { scale: 'binary', unit: 'B' })

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

export const Debug = ({ value }) => <pre>
  {JSON.stringify(value, null, 2)}
</pre>

// -------------------------------------------------------------------

const _NotFound = () => <h1>Page not found</h1>

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
