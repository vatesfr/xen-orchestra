import forEach from 'lodash/forEach'
import React, { Component } from 'react'
import ReactNotify from 'react-notify'
import _ from 'messages'

const instances = []

export class Notification extends Component {
  constructor () {
    super()
    instances.push(this)
  }
  notify (title, message, type, timer) {
    const args = [_(title), _(message), timer]
    switch (type) {
      case 'success':
        this.refs.notification.success(...args)
        break
      case 'info':
        this.refs.notification.info(...args)
        break
      case 'error':
        this.refs.notification.error(...args)
        break
      default: console.error(`'${type}' is not a valid notification type. Use 'success', 'info' or 'error' instead.`)
    }
  }
  render () {
    return <ReactNotify ref='notification' />
  }
}

const notify = (title, message, type = 'info', timer = 3000) => {
  forEach(instances, instance => instance.notify(title, message, type, timer))
}
export { notify as default }
