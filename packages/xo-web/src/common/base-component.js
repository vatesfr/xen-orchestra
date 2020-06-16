import { PureComponent } from 'react'
import { cowSet } from 'utils'
import { includes, forEach, map } from 'lodash'

import getEventValue from './get-event-value'

// Should components logs every renders?
//
// Usually set to process.env.NODE_ENV !== 'production'.
const VERBOSE = false

const get = (object, path, depth) => {
  if (object == null || depth >= path.length) {
    return object
  }

  const prop = path[depth++]
  return Array.isArray(object) && prop === '*'
    ? map(object, value => get(value, path, depth))
    : get(object[prop], path, depth)
}

export default class BaseComponent extends PureComponent {
  constructor(props, context) {
    super(props, context)

    // It really should have been done in React.Component!
    this.state = {}

    this._linkedState = null

    if (VERBOSE) {
      this.render = (render => () => {
        console.log('render', this.constructor.name)

        return render.call(this)
      })(this.render)
    }
  }

  // See https://preactjs.com/guide/linked-state
  linkState(name, targetPath) {
    const key = targetPath !== undefined ? `${name}##${targetPath}` : name

    let linkedState = this._linkedState
    let cb
    if (linkedState === null) {
      linkedState = this._linkedState = {}
    } else if ((cb = linkedState[key]) !== undefined) {
      return cb
    }

    let getValue
    if (targetPath !== undefined) {
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
        [name]: getValue(event),
      })
    })
  }

  toggleState(name) {
    let linkedState = this._linkedState
    let cb
    if (linkedState === null) {
      linkedState = this._linkedState = {}
    } else if ((cb = linkedState[name]) !== undefined) {
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
        [name]: !this.state[name],
      })
    })
  }
}

if (VERBOSE) {
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
