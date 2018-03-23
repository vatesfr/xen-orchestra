import Component from 'base-component'
import React from 'react'
import { Shortcuts as ReactShortcuts } from 'react-shortcuts'
import { forEach, noop, remove } from 'lodash'

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
  /* if we press unprintable keys when an input is focused,
       handler passing to ReactShortcuts fire the first.
    https://github.com/avocode/react-shortcuts/issues/13#issuecomment-255868423
  */
  render () {
    return enabled ? (
      <ReactShortcuts
        {...this.props}
        handler={(action, event) =>
          event.target.tagName === 'INPUT'
            ? noop
            : this.props.handler(action, event)
        }
      />
    ) : null
  }
}
