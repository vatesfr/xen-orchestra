'use strict'

const { asyncEach } = require('@vates/async-each')
const { forEach, fromCallback } = require('promise-toolbox')
const { join } = require('path')
const fs = require('fs')

const ROOT_DIR = join(__dirname, '..')

const _getPackages = scope => {
  const inScope = scope !== undefined
  const relativeDir = inScope ? scope : 'packages'
  const dir = `${ROOT_DIR}/${relativeDir}`
  return fromCallback(fs.readdir, dir).then(names =>
    names.map(name => ({
      dir: `${dir}/${name}`,
      name: inScope ? `${scope}/${name}` : name,
      relativeDir: `${relativeDir}/${name}`,
    }))
  )
}

exports.getPackages = (readPackageJson = false) => {
  const p = Promise.all([_getPackages(), _getPackages('@vates'), _getPackages('@xen-orchestra')]).then(pkgs => {
    pkgs = [].concat(...pkgs) // flatten
    return readPackageJson
      ? Promise.all(
          pkgs.map(pkg =>
            readFile(`${pkg.dir}/package.json`).then(data => {
              pkg.package = JSON.parse(data)
              return pkg
            }, noop)
          )
        ).then(pkgs => pkgs.filter(pkg => pkg !== undefined))
      : pkgs
  })
  p.forEach = fn => p.then(pkgs => forEach.call(pkgs, fn))
  p.map = (fn, opts) => p.then(pkgs => asyncEach(pkgs, fn, opts)).then(noop)
  return p
}

const noop = (exports.noop = () => {})

const readFile = (exports.readFile = file => fromCallback(fs.readFile, file, 'utf8'))

exports.symlink = (target, path) => fromCallback(fs.symlink, target, path)

exports.unlink = path =>
  fromCallback(fs.unlink, path).catch(error => {
    if (error.code !== 'ENOENT') {
      throw error
    }
  })

exports.writeFile = (file, data) => fromCallback(fs.writeFile, file, data)
