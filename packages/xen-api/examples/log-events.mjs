#!/usr/bin/env node

import 'source-map-support/register.js'

import forEach from 'lodash/forEach.js'
import size from 'lodash/size.js'

import { createClient } from '../index.mjs'

// ===================================================================

if (process.argv.length < 3) {
  throw new Error('Usage: log-events <XS URL>')
}

// ===================================================================
// Creation

const xapi = createClient({
  allowUnauthorized: true,
  url: process.argv[2],
})

// ===================================================================
// Method call

xapi.connect().then(() => {
  xapi
    .call('VM.get_all_records')
    .then(function (vms) {
      console.log('%s VMs fetched', size(vms))
    })
    .catch(function (error) {
      console.error(error)
    })
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
