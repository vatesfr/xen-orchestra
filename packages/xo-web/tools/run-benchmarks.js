#!/usr/bin/env node

require('babel-register')

const Benchmark = require('benchmark')
const globby = require('globby')
const resolve = require('path').resolve

// ===================================================================

function bench (path) {
  let fn = require(resolve(path))
  if (typeof fn !== 'function') {
    fn = fn.default
  }

  const benchmarks = []
  function benchmark (name, fn) {
    benchmarks.push(new Benchmark(name, fn))
  }

  fn({
    benchmark: benchmark,
  })

  benchmarks.forEach(function (benchmark) {
    console.log(String(benchmark.run()))
  })
}

function main (args) {
  if (!args.length) {
    throw new Error('missing path patterns')
  }

  return globby(args).then(function (paths) {
    if (!paths.length) {
      throw new Error('no files to run')
    }

    for (let i = 0, n = paths.length; i < n; ++i) {
      bench(paths[i])
    }
  })
}
new Promise(function (resolve) {
  resolve(main(process.argv.slice(2)))
}).catch(function (error) {
  console.log((error != null && (error.stack || error.message)) || error)
})
