const Disposable = require('promise-toolbox/Disposable')
const { join } = require('path')
const { mkdir, rmdir } = require('fs-extra')
const { tmpdir } = require('os')

const MAX_ATTEMPTS = 3

const getTmpDir = async () => {
  for (let i = 0; true; ++i) {
    const path = join(tmpdir(), Math.random().toString(36).slice(2))
    try {
      await mkdir(path)
      return new Disposable(path, () => rmdir(path))
    } catch (error) {
      if (i === MAX_ATTEMPTS) {
        throw error
      }
    }
  }
}

exports.getTmpDir = getTmpDir
