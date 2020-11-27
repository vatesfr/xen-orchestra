import _ from 'intl'
import ButtonLink from 'button-link'
import Icon from 'icon'
import React, { Component } from 'react'
import ReactNotify from 'react-notify'
import { connectStore } from 'utils'
import { isAdmin } from 'selectors'

let instance

export let error
export let info
export let success

@connectStore({
  isAdmin,
})
export class Notification extends Component {
  componentDidMount() {
    if (instance) {
      throw new Error('Notification is a singleton!')
    }
    instance = this
  }

  componentWillUnmount() {
    instance = undefined
  }

  // This special component never have to rerender!
  shouldComponentUpdate() {
    return false
  }

  render() {
    return (
      <ReactNotify
        ref={notification => {
          if (!notification) {
            return
          }

          error = (title, body, autoCloseTimeout = 6e3) =>
            notification.error(
              title,
              this.props.isAdmin ? (
                <div>
                  <div>{body}</div>
                  <ButtonLink btnStyle='danger' className='mt-1' size='small' to='/settings/logs'>
                    <Icon icon='logs' /> {_('showLogs')}
                  </ButtonLink>
                </div>
              ) : (
                body
              ),
              autoCloseTimeout
            )
          info = (title, body, autoCloseTimeout = 3e3) => notification.info(title, body, autoCloseTimeout)
          success = (title, body, autoCloseTimeout = 3e3) => notification.success(title, body, autoCloseTimeout)
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
