'use strict'

// ===================================================================

const gulp = require('gulp')

const babel = require('gulp-babel')
const coffee = require('gulp-coffee')
const plumber = require('gulp-plumber')
const rimraf = require('rimraf')
const sourceMaps = require('gulp-sourcemaps')
const watch = require('gulp-watch')

const join = require('path').join

// ===================================================================

const SRC_DIR = join(__dirname, 'src')
const DIST_DIR = join(__dirname, 'dist')

const PRODUCTION = process.argv.indexOf('--production') !== -1

// ===================================================================

function src (patterns) {
  return PRODUCTION
    ? gulp.src(patterns, {
      base: SRC_DIR,
      cwd: SRC_DIR,
    })
    : watch(patterns, {
      base: SRC_DIR,
      cwd: SRC_DIR,
      ignoreInitial: false,
      verbose: true,
    })
      .pipe(plumber())
}

// ===================================================================

gulp.task(function clean (cb) {
  rimraf(DIST_DIR, cb)
})

gulp.task(function buildCoffee () {
  return src('**/*.coffee')
    .pipe(sourceMaps.init())
    .pipe(coffee({
      bare: true,
    }))

    // Necessary to correctly compile generators.
    .pipe(babel())

    .pipe(sourceMaps.write('.'))
    .pipe(gulp.dest(DIST_DIR))
})

gulp.task(function buildEs6 () {
  return src([ '**/*.js', '!*.spec.js' ])
    .pipe(sourceMaps.init())
    .pipe(babel())
    .pipe(sourceMaps.write('.'))
    .pipe(gulp.dest(DIST_DIR))
})

// ===================================================================

gulp.task('build', gulp.series('clean', gulp.parallel('buildCoffee', 'buildEs6')))
