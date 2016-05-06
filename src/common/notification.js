import React, { Component } from 'react'
import ReactNotify from 'react-notify'

let instance

export let error
export let info
export let success

export class Notification extends Component {
  constructor () {
    super()

    if (instance) {
      throw new Error('Notification is a singleton!')
    }
    instance = this
  }

  render () {
    return <ReactNotify ref={notification => {
      error = (title, body) => notification.error(title, body, 3e3)
      info = (title, body) => notification.info(title, body, 3e3)
      success = (title, body) => notification.success(title, body, 3e3)
    }} />
  }
}

export { info as default }

/* Example:

import info, { success, error } from 'notification'

<button onClick={() => info('Info', 'This is an info notification')}>
  Info notification
</button>

<button onClick={() => success('Success', 'This is a success notification')}>
  Success notification
</button>

<button onClick={() => error('Error', 'This is an error notification')}>
  Error notification
</button>
*/
