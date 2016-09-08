import clone from 'lodash/clone'
import includes from 'lodash/includes'
import isArray from 'lodash/isArray'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import { Component } from 'react'

import getEventValue from './get-event-value'
import invoke from './invoke'
import shallowEqual from './shallow-equal'

const cowSet = (object, path, value, depth = 0) => {
  if (depth >= path.length) {
    return value
  }

  object = clone(object)
  object[path[depth]] = cowSet(object[path[depth]], path, value, depth + 1)
  return object
}

const deepFind = (object, path, depth = 0) => {
  if (!path || depth >= path.length) {
    return object
  }

  return deepFind(object[path[depth]], path, depth + 1)
}

export default class BaseComponent extends Component {
  constructor (props, context) {
    super(props, context)

    // It really should have been done in React.Component!
    this.state = {}

    this._linkedState = null

    if (process.env.NODE_ENV !== 'production') {
      this.render = invoke(this.render, render => () => {
        console.log('render', this.constructor.name)

        return render.call(this)
      })
    }
  }

  // See https://preactjs.com/guide/linked-state
  linkState (name, targetPath) {
    let linkedState = this._linkedState
    let cb
    if (!linkedState) {
      linkedState = this._linkedState = {}
    } else if ((cb = linkedState[name])) {
      return cb
    }

    targetPath = targetPath && targetPath.split('.')

    if (includes(name, '.')) {
      const path = name.split('.')
      return (linkedState[name] = event => {
        const rawValue = getEventValue(event)

        if (!targetPath) {
          return this.setState(cowSet(this.state, path, rawValue))
        }

        let value
        if (isArray(rawValue)) {
          value = map(rawValue, v => deepFind(v, targetPath))
        } else {
          value = deepFind(rawValue, targetPath)
        }
        this.setState(cowSet(this.state, path, value))
      })
    }

    return (linkedState[name] = event => {
      this.setState({
        [name]: deepFind(getEventValue(event), targetPath)
      })
    })
  }

  shouldComponentUpdate (newProps, newState) {
    return !(
      shallowEqual(this.props, newProps) &&
      shallowEqual(this.state, newState)
    )
  }
}

if (process.env.NODE_ENV !== 'production') {
  const diff = (name, old, cur) => {
    const keys = []

    forEach(old, (value, key) => {
      if (cur[key] !== value) {
        keys.push(key)
      }
    })

    if (keys.length) {
      console.log(name, keys.sort().join())
    }
  }

  BaseComponent.prototype.componentDidUpdate = function (oldProps, oldState) {
    const prefix = `${this.constructor.name} updated because of its`
    diff(`${prefix} props:`, oldProps, this.props)
    diff(`${prefix} state:`, oldState, this.state)
  }
}
