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
  componentDidMount() {
    instances.push(this)
  }
  componentWillUnmount() {
    remove(instances, this)
  }

  _handler = (command, event) => {
    // When an input is focused, shortcuts are disabled by default *except* for
    // non-printable keys (Esc, Enter, ...) but we want to disable them as well
    // https://github.com/avocode/react-shortcuts/issues/13#issuecomment-255868423
    if (event.target.tagName === 'INPUT') {
      return
    }

    this.props.handler(command, event)
  }

  render() {
    return enabled ? <ReactShortcuts {...this.props} handler={this._handler} /> : null
  }
}
