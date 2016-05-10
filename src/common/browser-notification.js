import Notify from 'notifyjs'

function onErrorNotification () {
  console.error('Error showing notification.')
}
function onPermissionGranted (title, body) {
  console.log('Notification permission has been granted.')
  triggerNotification(title, body)
}
function onPermissionDenied () {
  console.log('Notification permission has been denied.')
}

function triggerNotification (title, body) {
  var myNotification = new Notify(title, {
    body,
    tag: Date.now(),
    notifyError: onErrorNotification,
    timeout: 5
  })
  myNotification.show()
}
function notify (title, body) {
  if (!Notify.needsPermission) {
    triggerNotification(title, body)
  } else if (Notify.isSupported()) {
    Notify.requestPermission(() => onPermissionGranted(title, body), onPermissionDenied)
  }
}
export { notify as default }
