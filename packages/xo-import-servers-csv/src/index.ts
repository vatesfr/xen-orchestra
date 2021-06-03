#!/usr/bin/env node

/// <reference path="./index.d.ts" />

import csvParser = require('csv-parser')
import execPromise = require('exec-promise')
import through2 = require('through2')
import Xo from 'xo-lib'

const parseBoolean = (value: string, defaultValue?: boolean): boolean | undefined => {
  if (value === undefined || value === '') {
    return defaultValue
  }

  const lcValue = value.toLocaleLowerCase()

  if (value === '0' || lcValue === 'false') {
    return false
  }

  if (value === '1' || lcValue === 'true') {
    return true
  }

  throw new Error(`invalid boolean value: ${value}`)
}

const requiredParam = (name: string) => {
  throw `missing param: ${name}

Usage: xo-import-servers-csv $url $username $password < $csvFile`
}

execPromise(
  async ([
    url = requiredParam('url'),
    username = requiredParam('username'),
    password = requiredParam('password'),
  ]): Promise<void> => {
    const xo = new Xo({ url })

    await xo.open()
    await xo.signIn({ username, password })
    console.log('connected as', xo.user!.email)

    const errors: any[] = []

    const stream = process.stdin.pipe(csvParser()).pipe(
      through2.obj(({ allowUnauthorized, autoConnect, host, label, password, username }, _, next) => {
        console.log('server', host)

        xo.call('server.add', {
          allowUnauthorized: parseBoolean(allowUnauthorized),
          autoConnect: parseBoolean(autoConnect, false),
          host,
          label,
          password,
          username,
        }).then(
          () => next(),
          (error: any) => {
            errors.push({ host, error })
            return next()
          }
        )
      })
    )

    await new Promise((resolve, reject) => {
      stream.on('error', reject)
      stream.on('finish', resolve)
    })

    if (errors.length) {
      console.error(errors)
    }
  }
)
