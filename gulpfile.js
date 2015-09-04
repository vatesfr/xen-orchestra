'use strict'

// ===================================================================

var gulp = require('gulp')

var babel = require('gulp-babel')
var coffee = require('gulp-coffee')
var plumber = require('gulp-plumber')
var sourceMaps = require('gulp-sourcemaps')
var watch = require('gulp-watch')

// ===================================================================

var SRC_DIR = __dirname + '/src'
var DIST_DIR = __dirname + '/dist'

var PRODUCTION = process.argv.indexOf('--production') !== -1

// ===================================================================

function src (patterns) {
  return PRODUCTION
    ? gulp.src(patterns, {
      base: SRC_DIR,
      cwd: SRC_DIR
    })
    : watch(patterns, {
      base: SRC_DIR,
      cwd: SRC_DIR,
      ignoreInitial: false,
      verbose: true
    })
      .pipe(plumber())
}

// ===================================================================

gulp.task(function buildCoffee () {
  return src('**/*.coffee')
    .pipe(sourceMaps.init())
    .pipe(coffee({
      bare: true
    }))

    // Necessary to correctly compile generators.
    .pipe(babel())

    .pipe(sourceMaps.write('.'))
    .pipe(gulp.dest(DIST_DIR))
})

gulp.task(function buildEs6 () {
  return src('**/*.js')
    .pipe(sourceMaps.init())
    .pipe(babel())
    .pipe(sourceMaps.write('.'))
    .pipe(gulp.dest(DIST_DIR))
})

// ===================================================================

gulp.task('build', gulp.parallel('buildCoffee', 'buildEs6'))
