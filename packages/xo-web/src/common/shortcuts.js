import Component from 'base-component'
import React from 'react'
import { Shortcuts as ReactShortcuts } from 'react-shortcuts'
import { forEach, remove } from 'lodash'

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
  _handler = (action, event) => {
    // if we press unprintable keys when an input is focused,
    //   the handler passed to ReactShortcuts fires first.
    //  https://github.com/avocode/react-shortcuts/issues/13#issuecomment-255868423
    if (event.target.tagName === 'INPUT') return
    this.props.handler(action, event)
  }
  _handler = this._handler.bind(this)

  render () {
    return enabled ? (
      <ReactShortcuts {...this.props} handler={this._handler} />
    ) : null
  }
}
