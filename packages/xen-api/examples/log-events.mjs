#!/usr/bin/env node

import source_map_support from 'source-map-support'
source_map_support.install()

import _ from 'lodash'

import { createClient } from '../index.mjs'

// ===================================================================

if (process.argv.length < 3) {
  console.log('Usage: log-events <XS URL>')
  process.exit(1)
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
      console.log('%s VMs fetched', _.size(vms))
    })
    .catch(function (error) {
      console.error(error)
    })
})

// ===================================================================
// Objects

const objects = xapi.objects

objects.on('add', objects => {
  _.forEach(objects, object => {
    console.log('+ %s: %s', object.$type, object.$id)
  })
})

objects.on('update', objects => {
  _.forEach(objects, object => {
    console.log('± %s: %s', object.$type, object.$id)
  })
})

objects.on('remove', objects => {
  _.forEach(objects, (value, id) => {
    console.log('- %s', id)
  })
})
