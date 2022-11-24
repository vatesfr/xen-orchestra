/* eslint-disable no-console */

'use strict'

process.on('unhandledRejection', function (error) {
  console.log(error)
})

const Xo = require('./').default

const xo = new Xo({
  url: 'localhost:9000',
})

xo.open()
  .then(function () {
    return xo
      .call('acl.get', {})
      .then(function (result) {
        console.log('success:', result)
      })
      .catch(function (error) {
        console.log('failure:', error)
      })
  })
  .then(function () {
    return xo
      .signIn({
        email: 'admin@admin.net',
        password: 'admin',
      })
      .then(function () {
        console.log('connected as ', xo.user)
      })
      .catch(function (error) {
        console.log('failure:', error)
      })
  })
  .then(function () {
    return xo
      .signIn({
        email: 'tom',
        password: 'tom',
      })
      .then(function () {
        console.log('connected as', xo.user)

        return xo
          .call('acl.get', {})
          .then(function (result) {
            console.log('success:', result)
          })
          .catch(function (error) {
            console.log('failure:', error)
          })
      })
      .catch(function (error) {
        console.log('failure', error)
      })
  })
  .then(function () {
    return xo.close()
  })

/* eslint-enable no-console */
