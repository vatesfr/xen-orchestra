'use strict'

// ===================================================================

const httpServerPlus = require('../')

// ===================================================================

const server = httpServerPlus.create(function onRequest(request, response) {
  console.log('New request: %s %s', request.method, request.url)

  response.end('Nothing to see here.')
})

server
  .listen({
    host: 'localhost',
    port: 8080,
  })
  .then(function (niceAddress) {
    console.log('Listening on', niceAddress)
  })
  .catch(function (error) {
    console.log(error.code, '- Failed to listen on', error.niceAddress)
  })
