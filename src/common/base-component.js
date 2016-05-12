import forEach from 'lodash/forEach'
import { Component } from 'react'

import invoke from './invoke'
import shallowEqual from './shallow-equal'

const DEBUG = process.env.NODE_ENV !== 'production'

export default class BaseComponent extends Component {
  constructor (...args) {
    super(...args)

    // It really should have been done in React.Component!
    this.state = {}

    if (DEBUG) {
      this.render = invoke(this.render, render => () => {
        console.log('render', this.constructor.name)

        return render.call(this)
      })
    }
  }

  shouldComponentUpdate (newProps, newState) {
    return !(
      shallowEqual(this.props, newProps) &&
      shallowEqual(this.state, newState)
    )
  }
}

if (DEBUG) {
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
