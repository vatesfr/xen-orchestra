import Component from 'base-component'
import forEach from 'lodash/forEach'
import React from 'react'
import remove from 'lodash/remove'
import { Shortcuts as ReactShortcuts } from 'react-shortcuts'

let enabled = true
const instances = []

const updateInstances = () => {
  forEach(instances, instance => instance.forceUpdate())
}

export const enable = () => {
  enabled = true
  updateInstances()
}

export const disable = () => {
  enabled = false
  updateInstances()
}

export default class Shortcuts extends Component {
  componentDidMount () {
    instances.push(this)
  }
  componentWillUnmount () {
    remove(instances, this)
  }

  render () {
    return enabled ? <ReactShortcuts {...this.props} /> : null
  }
}
