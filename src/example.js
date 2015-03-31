import forEach from 'lodash.foreach'
import size from 'lodash.size'
import {createClient} from './'

// ===================================================================
// Creation

const xapi = createClient({
  url: 'https://192.168.1.1',
  auth: {
    user: 'root',
    password: 'qwerty'
  }
})

// ===================================================================
// Events

xapi.on('events', function (events) {
  forEach(events, event => {
    console.log(
      '[event] %s %s: %s',
      event.operation,
      event.class,
      event.ref
    )
  })
})

xapi.on('eventsLost', function () {
  console.warn('[event] some events may have been lost')
})

// ===================================================================
// Method call

xapi.call('VM.get_all_records', [])
  .then(function (vms) {
    console.log('%s VMs fetched', size(vms))
  })
  .catch(function (error) {
    console.error(error)
  })
