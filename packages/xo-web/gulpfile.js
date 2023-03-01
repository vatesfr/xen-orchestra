'use strict'

// ===================================================================

const SRC_DIR = __dirname + '/src' // eslint-disable-line no-path-concat
const DIST_DIR = __dirname + '/dist' // eslint-disable-line no-path-concat

// Port to use for the livereload server.
//
// It must be available and if possible unique to not conflict with other projects.
// http://www.random.org/integers/?num=1&min=1024&max=65535&col=1&base=10&format=plain&rnd=new
const LIVERELOAD_PORT = 26242

const PRODUCTION = process.env.NODE_ENV === 'production'
const DEVELOPMENT = !PRODUCTION

if (!process.env.XOA_PLAN) {
  process.env.XOA_PLAN = '5' // Open Source
}

// ===================================================================

const gulp = require('gulp')

// ===================================================================

function lazyFn(factory) {
  let fn = function () {
    fn = factory()
    return fn.apply(this, arguments)
  }

  return function () {
    return fn.apply(this, arguments)
  }
}

// -------------------------------------------------------------------

const livereload = lazyFn(function () {
  const livereload = require('gulp-refresh')
  livereload.listen({
    port: LIVERELOAD_PORT,
  })

  return livereload
})

const pipe = lazyFn(function () {
  let current
  function pipeCore(streams) {
    let i, n, stream
    for (i = 0, n = streams.length; i < n; ++i) {
      stream = streams[i]
      if (!stream) {
        // Nothing to do
      } else if (stream instanceof Array) {
        pipeCore(stream)
      } else {
        current = current ? current.pipe(stream) : stream
      }
    }
  }

  const push = Array.prototype.push
  return function (streams) {
    try {
      if (!(streams instanceof Array)) {
        streams = []
        push.apply(streams, arguments)
      }

      pipeCore(streams)

      return current
    } finally {
      current = null
    }
  }
})

const resolvePath = lazyFn(function () {
  return require('path').resolve
})

// -------------------------------------------------------------------

// Similar to `gulp.src()` but the pattern is relative to `SRC_DIR`
// and files are automatically watched when not in production mode.
const src = lazyFn(function () {
  function resolve(path) {
    return path ? resolvePath(SRC_DIR, path) : SRC_DIR
  }

  return PRODUCTION
    ? function src(pattern, opts) {
        const base = resolve(opts && opts.base)

        return gulp.src(pattern, {
          base,
          cwd: base,
          passthrough: opts && opts.passthrough,
          sourcemaps: opts && opts.sourcemaps,
        })
      }
    : function src(pattern, opts) {
        const base = resolve(opts && opts.base)

        return pipe(
          gulp.src(pattern, {
            base,
            cwd: base,
            passthrough: opts && opts.passthrough,
            sourcemaps: opts && opts.sourcemaps,
          }),
          require('gulp-watch')(pattern, {
            base,
            cwd: base,
          }),
          require('gulp-plumber')()
        )
      }
})

// Similar to `gulp.dest()` but the output directory is relative to
// `DIST_DIR` and default to `./`, and files are automatically live-
// reloaded when not in production mode.
const dest = lazyFn(function () {
  function resolve(path) {
    return path ? resolvePath(DIST_DIR, path) : DIST_DIR
  }

  const opts = {
    sourcemaps: '.',
  }

  return PRODUCTION
    ? function dest(path) {
        return gulp.dest(resolve(path), opts)
      }
    : function dest(path) {
        const stream = gulp.dest(resolve(path), opts)
        stream.pipe(livereload())
        return stream
      }
})

// ===================================================================

function browserify(path, opts) {
  if (opts == null) {
    opts = {}
  }

  let bundler = require('browserify')(path, {
    basedir: SRC_DIR,
    debug: true,
    extensions: opts.extensions,
    fullPaths: false,
    paths: SRC_DIR + '/common',
    standalone: opts.standalone,

    // Required by Watchify.
    cache: {},
    packageCache: {},
  })

  const plugins = opts.plugins
  for (let i = 0, n = plugins && plugins.length; i < n; ++i) {
    const plugin = plugins[i]
    bundler.plugin(require(plugin[0]), plugin[1])
  }

  if (PRODUCTION) {
    // FIXME: does not work with react-intl (?!)
    // bundler.plugin('bundle-collapser/plugin')
  } else {
    bundler = require('watchify')(bundler, {
      // do not watch in `node_modules`
      // https://github.com/browserify/watchify#options
      ignoreWatch: true,
    })
  }

  // Append the extension if necessary.
  if (!/\.js$/.test(path)) {
    path += '.js'
  }
  path = resolvePath(SRC_DIR, path)

  let stream = new (require('readable-stream'))({
    objectMode: true,
  })

  let write
  function bundle() {
    bundler.bundle(function onBundle(error, buffer) {
      if (error) {
        stream.emit('error', error)
        return
      }

      write(
        new (require('vinyl'))({
          base: SRC_DIR,
          contents: buffer,
          path,
        })
      )
    })
  }

  if (PRODUCTION) {
    write = function (data) {
      stream.push(data)
      stream.push(null)
    }
  } else {
    stream = require('gulp-plumber')().pipe(stream)
    write = function (data) {
      stream.push(data)
    }

    bundler.on('update', bundle)
  }

  stream._read = function () {
    this._read = function () {}
    bundle()
  }

  return stream
}

// ===================================================================

gulp.task(function buildPages() {
  return pipe(
    src('index.pug'),
    require('gulp-pug')(),
    DEVELOPMENT &&
      require('gulp-embedlr')({
        port: LIVERELOAD_PORT,
      }),
    dest()
  )
})

gulp.task(function buildScripts() {
  return pipe(
    browserify('./index.js', {
      plugins: [
        // ['css-modulesify', {
        [
          'modular-cssify',
          {
            css: DIST_DIR + '/modules.css',
            from: undefined,
          },
        ],
      ],
    }),
    require('gulp-sourcemaps').init({ loadMaps: true }),
    PRODUCTION && require('gulp-terser')(),
    dest()
  )
})

gulp.task(function buildStyles() {
  return pipe(
    src('index.scss', { sourcemaps: true }),
    require('gulp-sass')(require('sass'))(),
    require('gulp-autoprefixer')(['last 1 version', '> 1%']),
    PRODUCTION && require('gulp-csso')(),
    dest()
  )
})

gulp.task(function copyAssets() {
  return pipe(
    src(['assets/**/*', 'favicon.*']),
    src('fontawesome-webfont.*', {
      base: __dirname + '/../../node_modules/font-awesome/fonts', // eslint-disable-line no-path-concat
      passthrough: true,
    }),
    src(['!*.css', 'font-mfizz.*'], {
      base: __dirname + '/../../node_modules/font-mfizz/dist', // eslint-disable-line no-path-concat
      passthrough: true,
    }),
    dest()
  )
})

gulp.task('build', gulp.parallel('buildPages', 'buildScripts', 'buildStyles', 'copyAssets'))

// -------------------------------------------------------------------

gulp.task(function clean(done) {
  require('rimraf')(DIST_DIR).then(value => done(null, value), done)
})
