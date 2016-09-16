#!/usr/bin/env node

/// <reference path="./index.d.ts" />

import csvParser = require('csv-parser')
import endOfStream = require('end-of-stream')
import execPromise = require('exec-promise')
import through2 = require('through2')
import Xo from 'xo-lib'

const requiredParam = (name: string) => {
  throw `missing param: ${name}`
}

execPromise(async ([
  url = requiredParam('url'),
  user = requiredParam('user'),
  password = requiredParam('password')
]): any => {
  const xo = new Xo({ url })

  await xo.open()
  await xo.signIn({ user, password })
  console.log('connected', xo.user)

  const errors: any[] = []

  const stream = process.stdin
    .pipe(csvParser())
    .pipe(through2.obj((chunk, _, next) => {
      const [ host, username, password ] = chunk as string[]
      xo.call('server.add', { host, username, password, autoConnect: false })
        .then(
          () => next(),
          (error: any) => {
            errors.push({ host, error })
            return next()
          }
        )
    }))

  return new Promise((resolve, reject) => {
    endOfStream(stream, error => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
})
