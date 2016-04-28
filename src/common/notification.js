import React, { Component } from 'react'
// import _ from 'messages'
import ReactNotify from 'react-notify'

export default class Notification extends Component {
  notify (title, message, type = 'info', timer = 4000) {
    switch (type) {
      case 'success':
        this.refs.notification.success(title, message, timer)
        break
      case 'info':
        this.refs.notification.info(title, message, timer)
        break
      case 'error':
        this.refs.notification.error(title, message, timer)
        break
    }
  }

  render () {
    return <ReactNotify ref='notification' />
  }
}
