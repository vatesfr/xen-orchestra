import forEach from 'lodash.foreach'
import size from 'lodash.size'
import {createClient} from './'

import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

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
// Method call

const getAllVms = xapi.call('VM.get_all_records')

getAllVms()
  .then(function (vms) {
    console.log('%s VMs fetched', size(vms))
  })
  .catch(function (error) {
    console.error(error)
  })

// ===================================================================
// Objects

const objects = xapi.objects

objects.on('add', objects => {
  forEach(objects, object => {
    console.log('+ %s: %s', object.$type, object.$id)
  })
})

objects.on('update', objects => {
  forEach(objects, object => {
    console.log('± %s: %s', object.$type, object.$id)
  })
})

objects.on('remove', objects => {
  forEach(objects, (value, id) => {
    console.log('- %s', id)
  })
})
