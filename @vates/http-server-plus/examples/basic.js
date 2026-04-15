'use strict'

// ===================================================================

const httpServerPlus = require('../')

// ===================================================================

const server = httpServerPlus.create(function onRequest(request, response) {
  // eslint-disable-next-line no-console
  console.log('New request: %s %s', request.method, request.url)

  response.end('Nothing to see here.')
})

server
  .listen({
    host: 'localhost',
    port: 8080,
  })
  .then(function (niceAddress) {
    // eslint-disable-next-line no-console
    console.log('Listening on', niceAddress)
  })
  .catch(function (error) {
    // eslint-disable-next-line no-console
    console.log(error.code, '- Failed to listen on', error.niceAddress)
  })
