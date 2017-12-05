import _ from 'intl'
import ActionButton from 'action-button'
import React, { Component } from 'react'
import ReactNotify from 'react-notify'
import { connectStore } from 'utils'
import { isAdmin } from 'selectors'
import { noop } from 'lodash'

let instance

export let error
export let info
export let success

@connectStore({
  isAdmin,
})
export class Notification extends Component {
  componentDidMount () {
    if (instance) {
      throw new Error('Notification is a singleton!')
    }
    instance = this
  }

  componentWillUnmount () {
    instance = undefined
  }

  // This special component never have to rerender!
  shouldComponentUpdate () {
    return false
  }

  render () {
    return (
      <ReactNotify
        ref={notification => {
          if (!notification) {
            return
          }

          error = (title, body) =>
            notification.error(
              title,
              this.props.isAdmin ? (
                <div>
                  <div>{body}</div>
                  <ActionButton
                    btnStyle='danger'
                    className='mt-1'
                    handler={noop}
                    icon='logs'
                    redirectOnSuccess='/settings/logs'
                    size='small'
                  >
                    {_('showLogs')}
                  </ActionButton>
                </div>
              ) : (
                body
              ),
              6e3
            )
          info = (title, body) => notification.info(title, body, 3e3)
          success = (title, body) => notification.success(title, body, 3e3)
        }}
      />
    )
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
