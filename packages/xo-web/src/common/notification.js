import _ from 'intl'
import ButtonLink from 'button-link'
import Icon from 'icon'
import React, { Component } from 'react'
import ReactNotify from 'react-notify'
import { connectStore } from 'utils'
import { isAdmin } from 'selectors'
import fetch from './fetch'

let instance

export let error
export let info
export let success

const publicVapidKey = 'BDAqBcWLLjbzGSMjVqlhZmU88uiAVascwXn5mbiuMVFpsXiJixtIxVpu06pIX1b8cjXKYawsv-FuGhp9oH_1dwc'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// register the service worker, register our push api, send the notification
async function registerNotificationServiceWorker() {
  // register service worker
  const register = await navigator.serviceWorker.register('/serviceworker.js', {
    scope: '/'
  })

  // register push
  const subscription = await register.pushManager.subscribe({
    userVisibleOnly: true,

    // public vapid key
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
  })
  // Send push notification
  await fetch('/service-worker-subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'content-type': 'application/json'
    }
  })
}

@connectStore({
  isAdmin
})
export class Notification extends Component {
  componentDidMount() {
    if (instance) {
      throw new Error('Notification is a singleton!')
    }
    instance = this

    // check if the serveice worker can work in the current browser
    if ('serviceWorker' in navigator) {
      registerNotificationServiceWorker()
    }
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
