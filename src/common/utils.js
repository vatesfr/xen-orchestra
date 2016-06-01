import * as actions from 'store/actions'
import assign from 'lodash/assign'
import forEach from 'lodash/forEach'
import humanFormat from 'human-format'
import includes from 'lodash/includes'
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
  }

  _style = { cursor: 'pointer' }
  _onClickCapture = event => {
    const { currentTarget } = event
    let element = event.target
    while (element !== currentTarget) {
      if (includes(['A', 'INPUT', 'BUTTON', 'SELECT'], element.tagName)) {
        return
      }
      element = element.parentNode
    }
    event.stopPropagation()
    this.context.router.push(this.props.to)
  }

  render () {
    const { children } = this.props
    return (
      <div
        style={this._style}
        onClickCapture={this._onClickCapture}
      >
        {children}
      </div>
    )
  }
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
    return mapper
  }

  if (isArray(mapper)) {
    return pick(mapper)
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

// Simple matcher to use in object filtering.
export const createSimpleMatcher = (pattern, valueGetter) => {
  if (!pattern) {
    return
  }

  pattern = pattern.toLowerCase()
  return item => valueGetter(item).toLowerCase().indexOf(pattern) !== -1
}

// -------------------------------------------------------------------

// Returns the first defined (non-null, non-undefined) value.
export const firstDefined = function () {
  const n = arguments.length
  for (let i = 0; i < n; ++i) {
    const arg = arguments[i]
    if (arg != null) {
      return arg
    }
  }
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
  centos: [ 'centos' ],
  debian: [ 'debian' ],
  fedora: [ 'fedora' ],
  freebsd: [ 'freebsd' ],
  gentoo: [ 'gentoo' ],
  linux: [ 'coreos' ],
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
  target.propTypes = {
    ...target.propTypes,
    ...types
  }

  return target
}
assign(propTypes, PropTypes)

// -------------------------------------------------------------------

export const formatSize = bytes => humanFormat(bytes, { scale: 'binary', unit: 'B' })

export const formatSizeRaw = bytes => humanFormat.raw(bytes, { scale: 'binary', unit: 'B' })

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

// -------------------------------------------------------------------

export function tap (cb) {
  return this.then(value =>
    Promise.resolve(cb(value)).then(() => value)
  )
}
