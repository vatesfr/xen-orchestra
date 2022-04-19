#!/usr/bin/env node

'use strict'

require('@babel/register')

const pkg = require('../package.json')
const Benchmark = require('benchmark')
const globby = require('globby')
const resolve = require('path').resolve

// ===================================================================

function bench(path) {
  let fn = require(resolve(path))
  if (typeof fn !== 'function') {
    fn = fn.default
  }

  const benchmarks = []
  function benchmark(name, fn) {
    benchmarks.push(new Benchmark(name, fn))
  }

  fn({
    benchmark,
  })

  benchmarks.forEach(function (benchmark) {
    console.log(String(benchmark.run()))
  })
}

function main() {
  return globby(pkg.workspaces.map(workspace => resolve(__dirname, '..', workspace, 'src/**/*.bench.js'))).then(
    function (paths) {
      if (!paths.length) {
        throw new Error('no files to run')
      }

      for (let i = 0, n = paths.length; i < n; ++i) {
        bench(paths[i])
      }
    }
  )
}
new Promise(function (resolve) {
  resolve(main())
}).catch(function (error) {
  console.log((error != null && (error.stack || error.message)) || error)
})
