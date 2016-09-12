import clone from 'lodash/clone'
import includes from 'lodash/includes'
import isArray from 'lodash/isArray'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import { Component } from 'react'

import getEventValue from './get-event-value'
import invoke from './invoke'
import shallowEqual from './shallow-equal'

const cowSet = (object, path, value, depth) => {
  if (depth >= path.length) {
    return value
  }

  object = clone(object)
  const prop = path[depth]
  object[prop] = cowSet(object[prop], path, value, depth + 1)
  return object
}

const get = (object, path, depth) => {
  if (depth >= path.length) {
    return object
  }

  const prop = path[depth++]
  return isArray(object) && prop === '*'
    ? map(object, value => get(value, path, depth))
    : get(object[prop], path, depth)
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
    const key = targetPath
      ? `${name}##${targetPath}`
      : name

    let linkedState = this._linkedState
    let cb
    if (!linkedState) {
      linkedState = this._linkedState = {}
    } else if ((cb = linkedState[key])) {
      return cb
    }

    let getValue
    if (targetPath) {
      const path = targetPath.split('.')
      getValue = event => get(getEventValue(event), path, 0)
    } else {
      getValue = getEventValue
    }

    if (includes(name, '.')) {
      const path = name.split('.')
      return (linkedState[key] = event => {
        this.setState(cowSet(this.state, path, getValue(event), 0))
      })
    }

    return (linkedState[key] = event => {
      this.setState({
        [name]: getValue(event)
      })
    })
  }

  toggleState (name) {
    let linkedState = this._linkedState
    let cb
    if (!linkedState) {
      linkedState = this._linkedState = {}
    } else if ((cb = linkedState[name])) {
      return cb
    }

    if (includes(name, '.')) {
      const path = name.split('.')
      return (linkedState[path] = event => {
        this.setState(cowSet(this.state, path, !get(this.state, path, 0), 0))
      })
    }

    return (linkedState[name] = () => {
      this.setState({
        [name]: !this.state[name]
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
