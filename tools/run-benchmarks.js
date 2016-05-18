#!/usr/bin/env node

require('babel-register')

var Benchmark = require('benchmark')
var globby = require('globby')
var resolve = require('path').resolve

// ===================================================================

function bench (path) {
  var fn = require(resolve(path))
  if (typeof fn !== 'function') {
    fn = fn.default
  }

  var benchmarks = []
  function benchmark (name, fn) {
    benchmarks.push(new Benchmark(name, fn))
  }

  fn({
    benchmark: benchmark
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

    for (var i = 0, n = paths.length; i < n; ++i) {
      bench(paths[i])
    }
  })
}
new Promise(function (resolve) {
  resolve(main(process.argv.slice(2)))
}).catch(function (error) {
  console.log(error && (error.stack || error.message) || error)
})
