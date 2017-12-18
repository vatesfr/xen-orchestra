const { forEach, fromCallback } = require('promise-toolbox')
const fs = require('fs')

const PKGS_DIR = `${__dirname}/../packages`

exports.getPackages = (readPackageJson = false) => {
  const p = fromCallback(cb =>
    fs.readdir(PKGS_DIR, cb)
  ).then(names => {
    const pkgs = names.map(name => ({
      dir: `${PKGS_DIR}/${name}`,
      name,
    }))
    return readPackageJson
      ? Promise.all(pkgs.map(pkg =>
        readFile(`${pkg.dir}/package.json`).then(data => {
          pkg.package = JSON.parse(data)
          return pkg
        }, noop)
      )).then(pkgs => pkgs.filter(pkg => pkg !== undefined))
      : pkgs
  })
  p.forEach = fn => p.then(pkgs => forEach.call(pkgs, fn))
  p.map = fn => p.then(pkgs => Promise.all(pkgs.map(fn))).then(noop)
  return p
}

const noop = exports.noop = () => {}

const readFile = exports.readFile = file => fromCallback(cb =>
  fs.readFile(file, 'utf8', cb)
)

exports.unlink = path => fromCallback(cb =>
  fs.unlink(path, cb)
).catch(error => {
  if (error.code !== 'ENOENT') {
    throw error
  }
})

exports.writeFile = (file, data) => fromCallback(cb =>
  fs.writeFile(file, data, cb)
)
