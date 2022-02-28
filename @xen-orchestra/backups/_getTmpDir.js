'use strict'

const Disposable = require('promise-toolbox/Disposable')
const { join } = require('path')
const { mkdir, rmdir } = require('fs-extra')
const { tmpdir } = require('os')

const MAX_ATTEMPTS = 3

exports.getTmpDir = async function getTmpDir() {
  for (let i = 0; true; ++i) {
    const path = join(tmpdir(), Math.random().toString(36).slice(2))
    try {
      await mkdir(path)
      return new Disposable(() => rmdir(path), path)
    } catch (error) {
      if (i === MAX_ATTEMPTS) {
        throw error
      }
    }
  }
}
