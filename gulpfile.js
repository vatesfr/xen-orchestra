// Julien Fontanet gulpfile.js
//
// https://gist.github.com/julien-f/4af9f3865513efeff6ab

'use strict'

// ===================================================================

var gulp = require('gulp')

// All plugins are loaded (on demand) by gulp-load-plugins.
var $ = require('gulp-load-plugins')()

var pipe = require('nice-pipe')

// ===================================================================

var DIST_DIR = __dirname + '/dist'
var SRC_DIR = __dirname + '/app'

// Bower directory is read from its configuration.
var BOWER_DIR = (function () {
  var cfg

  try {
    cfg = JSON.parse(require('fs').readFileSync(__dirname + '/.bowerrc'))
  } catch (error) {
    cfg = {}
  }

  cfg.cwd || (cfg.cwd = __dirname)
  cfg.directory || (cfg.directory = 'bower_components')

  return cfg.cwd + '/' + cfg.directory
})()

var PRODUCTION = process.argv.indexOf('--production') !== -1

// Port to use for the livereload server.
//
// It must be available and if possible unique to not conflict with other projects.
// http://www.random.org/integers/?num=1&min=1024&max=65535&col=1&base=10&format=plain&rnd=new
var LIVERELOAD_PORT = 46417

// Port to use for the embedded web server.
//
// Set to 0 to choose a random port at each run.
var SERVER_PORT = LIVERELOAD_PORT + 1

// Address the server should bind to.
//
// - `'localhost'` to make it accessible from this host only
// - `null` to make it accessible for the whole network
var SERVER_ADDR = 'localhost'

// -------------------------------------------------------------------

// Create a noop duplex stream.
var noop = function () {
  var PassThrough = require('stream').PassThrough

  noop = function () {
    return new PassThrough({
      objectMode: true
    })
  }

  return noop.apply(this, arguments)
}

// Browserify plugin for gulp.js which uses watchify in development
// mode.
function browserify (path, opts) {
  opts || (opts = {})

  var bundler = require('browserify')({
    basedir: SRC_DIR,
    debug: !PRODUCTION,
    entries: [path],
    extensions: opts.extensions,
    standalone: opts.standalone,

    // Required by Watchify.
    cache: {},
    packageCache: {},
    fullPaths: !PRODUCTION
  })

  if (PRODUCTION) {
    bundler.plugin('bundle-collapser/plugin')
  } else {
    bundler = require('watchify')(bundler)
  }

  // Append the extension if necessary.
  if (!/\.js$/.test(path)) {
    path += '.js'
  }

  // Absolute path.
  path = require('path').resolve(SRC_DIR, path)

  var proxy = noop()

  var write
  function bundle () {
    bundler.bundle(function onBundleComplete (err, buf) {
      if (err) {
        proxy.emit('error', err)
        return
      }

      write(new (require('vinyl'))({
        base: SRC_DIR,
        path: path,
        contents: buf
      }))
    })
  }
  if (PRODUCTION) {
    write = proxy.end.bind(proxy)
  } else {
    proxy = $.plumber().pipe(proxy)
    write = proxy.write.bind(proxy)
    bundler.on('update', bundle)
  }
  bundle()

  return proxy
}

// Combine multiple streams together and can be handled as a single
// stream.
var combine = function () {
  // `event-stream` is required only when necessary to maximize
  // performance.
  combine = require('event-stream').pipe
  return combine.apply(this, arguments)
}

// Merge multiple readable streams into a single one.
var merge = function () {
  // `event-stream` is required only when necessary to maximize
  // performance.
  merge = require('event-stream').merge
  return merge.apply(this, arguments)
}

// Similar to `gulp.src()` but the pattern is relative to `SRC_DIR`
// and files are automatically watched when not in production mode.
var src = (function () {
  var resolvePath = require('path').resolve
  function resolve (path) {
    if (path) {
      return resolvePath(SRC_DIR, path)
    }
    return SRC_DIR
  }

  if (PRODUCTION) {
    return function src (pattern, base) {
      base = resolve(base)

      return gulp.src(pattern, {
        base: base,
        cwd: base
      })
    }
  }

  // gulp-plumber prevents streams from disconnecting when errors.
  // See: https://gist.github.com/floatdrop/8269868#file-thoughts-md
  return function src (pattern, base) {
    base = resolve(base)

    return gulp.src(pattern, {
      base: base,
      cwd: base
    })
      .pipe($.watch(pattern, {
        base: base,
        cwd: base
      }))
      .pipe($.plumber())
  }
})()

// Similar to `gulp.dest()` but the output directory is relative to
// `DIST_DIR` and default to `./`, and files are automatically live-
// reloaded when not in production mode.
var dest = (function () {
  var resolvePath = require('path').resolve
  function resolve (path) {
    if (path) {
      return resolvePath(DIST_DIR, path)
    }
    return DIST_DIR
  }

  if (PRODUCTION) {
    return function dest (path) {
      return gulp.dest(resolve(path))
    }
  }

  var livereload = function () {
    $.livereload.listen(LIVERELOAD_PORT)

    livereload = $.livereload
    return livereload()
  }

  return function dest (path) {
    return combine(
      gulp.dest(resolve(path)),
      livereload()
    )
  }
})()

// ===================================================================

gulp.task('buildPages', function buildPages () {
  return pipe([
    src('[i]ndex.jade'),
    $.jade(),
    !PRODUCTION && $.embedlr({ port: LIVERELOAD_PORT }),
    dest()
  ])
})

gulp.task('buildScripts', [
  'installBowerComponents'
], function buildScripts () {
  return pipe([
    browserify('./app.js', {
      extensions: '.coffee .jade'.split(' ')
    }),
    PRODUCTION && $.uglify({ mangle: false }),
    dest()
  ])
})

gulp.task('buildStyles', [
  'installBowerComponents'
], function buildStyles () {
  return pipe([
    src('styles/[m]ain.scss'),
    !PRODUCTION && $.sourcemaps.init({
      loadMaps: true
    }),
    $.sass(),
    $.autoprefixer([
      'last 1 version',
      '> 1%'
    ]),
    PRODUCTION && $.minifyCss(),
    !PRODUCTION && $.sourcemaps.write(),
    dest()
  ])
})

gulp.task('copyAssets', [
  'installBowerComponents'
], function copyAssets () {
  var imgStream
  if (PRODUCTION) {
    var imgFilter = $.filter('**/*.{gif,jpg,jpeg,png,svg}', {restore: true})

    imgStream = combine(
      imgFilter,
      $.imagemin({
        progressive: true
      }),
      imgFilter.restore
    )
  } else {
    imgStream = noop()
  }

  return pipe([
    merge(
      src([
        '[f]avicon.ico',
        'images/**/*'
      ]).pipe(imgStream),
      src(
        'fontawesome-webfont.*',
        __dirname + '/node_modules/font-awesome/fonts/'
      )
    ),
    dest()
  ])
})

gulp.task('copyFontMfizz', function copyAssets () {
  return pipe([
    src(
      '*',
      __dirname + '/font-mfizz-2.0/'
    ),
    dest('styles')
  ])
})

gulp.task('installBowerComponents', function installBowerComponents (done) {
  require('bower').commands.install()
    .on('error', done)
    .on('end', function () {
      done()
    })
})

// -------------------------------------------------------------------

gulp.task('build', [
  'buildPages',
  'buildScripts',
  'buildStyles',
  'copyAssets',
  'copyFontMfizz'
])

gulp.task('clean', function clear (done) {
  require('rimraf')(DIST_DIR, done)
})

gulp.task('distclean', ['clean'], function distclean (done) {
  require('rimraf')(BOWER_DIR, done)
})

gulp.task('server', function server (done) {
  require('connect')()
    .use(require('serve-static')(DIST_DIR))
    .listen(SERVER_PORT, SERVER_ADDR, function serverOnListen () {
      var address = this.address()

      var port = address.port
      address = address.address

      // Correctly handle IPv6 addresses.
      if (address.indexOf(':') !== -1) {
        address = '[' + address + ']'
      }

      console.log('Listening on http://' + address + ':' + port)
    })
    .on('close', function serverOnClose () {
      done()
    })
})

// -----------------------------------------------------------------------------

gulp.task('default', ['build'])
