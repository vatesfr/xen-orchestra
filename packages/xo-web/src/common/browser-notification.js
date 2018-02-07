import { noop } from 'utils'
import Notify from 'notifyjs'

let notify
export { notify as default }

const sendNotification = (title, body) => {
  new Notify(title, {
    body,
    timeout: 5,
    icon: 'assets/logo.png',
  }).show()
}

const requestPermission = (...args) => {
  if (Notify.isSupported()) {
    Notify.requestPermission(
      () => {
        console.log('notifications allowed')

        return (notify = sendNotification)(...args)
      },
      () => {
        console.log('notifications denied')

        notify = noop
      }
    )
  } else {
    notify = noop
    console.warn('notifications are not supported')
  }
}

notify = Notify.needsPermission ? requestPermission : sendNotification
