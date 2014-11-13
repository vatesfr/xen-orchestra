// Julien Fontanet gulpfile.js
//
// https://gist.github.com/julien-f/4af9f3865513efeff6ab

'use strict';

//====================================================================

var gulp = require('gulp');

// All plugins are loaded (on demand) by gulp-load-plugins.
var $ = require('gulp-load-plugins')();

//====================================================================

var DIST_DIR = __dirname +'/dist';
var SRC_DIR = __dirname +'/app';

// Bower directory is read from its configuration.
var BOWER_DIR = (function () {
  var cfg;

  try
  {
    cfg = JSON.parse(require('fs').readFileSync(__dirname +'/.bowerrc'));
  }
  catch (error)
  {
    cfg = {};
  }

  cfg.cwd || (cfg.cwd = __dirname);
  cfg.directory || (cfg.directory = 'bower_components');

  return cfg.cwd +'/'+ cfg.directory;
})();

var PRODUCTION = process.argv.indexOf('--production') !== -1;

// Port to use for the livereload server.
//
// It must be available and if possible unique to not conflict with other projects.
// http://www.random.org/integers/?num=1&min=1024&max=65535&col=1&base=10&format=plain&rnd=new
var LIVERELOAD_PORT = 46417;

// Port to use for the embedded web server.
//
// Set to 0 to choose a random port at each run.
var SERVER_PORT = LIVERELOAD_PORT + 1;

// Address the server should bind to.
//
// - `'localhost'` to make it accessible from this host only
// - `null` to make it accessible for the whole network
var SERVER_ADDR = 'localhost';

//--------------------------------------------------------------------

// Browserify plugin for gulp.js which uses watchify in development
// mode.
function browserify(path, opts) {
  opts || (opts = {});

  var bundler = require('browserify')({
    basedir: SRC_DIR,
    debug: !PRODUCTION,
    entries: [path],
    extensions: opts.extensions,
    standalone: opts.standalone,

    // Required by Watchify.
    cache: {},
    packageCache: {},
    fullPaths: true,
  });
  if (opts.transforms)
  {
    [].concat(opts.transforms).forEach(function addTransform(transform) {
      if (transform instanceof Array) {
        bundler.transform.apply(bundler, transform);
      } else {
        bundler.transform(transform);
      }
    });
  }

  if (!PRODUCTION) {
    bundler = require('watchify')(bundler);
  }

  // Append the extension if necessary.
  if (!/\.js$/.test(path))
  {
    path += '.js';
  }

  // Absolute path.
  path = require('path').resolve(path);

  var proxy = $.plumber().pipe(new (require('stream').PassThrough)({
    objectMode: true,
  }));

  var write;
  function bundle() {
    bundler.bundle(function onBundleComplete(err, buf) {
      if (err) {
        proxy.emit('error', err);
        return;
      }

      write(new (require('vinyl'))({
        base: opts.base,
        path: path,
        contents: buf,
      }));
    });
  }
  if (PRODUCTION) {
    write = proxy.end.bind(proxy);
  } else {
    write = proxy.write.bind(proxy);
    bundler.on('update', bundle);
  }
  bundle();

  return proxy;
}

// Combine multiple streams together and can be handled as a single
// stream.
var combine = function () {
  // `event-stream` is required only when necessary to maximize
  // performance.
  combine = require('event-stream').pipe;
  return combine.apply(this, arguments);
};

// Merge multiple readable streams into a single one.
var merge = function () {
  // `event-stream` is required only when necessary to maximize
  // performance.
  merge = require('event-stream').merge;
  return merge.apply(this, arguments);
};

// Create a noop duplex stream.
var noop = function () {
  var PassThrough = require('stream').PassThrough;

  noop = function () {
    return new PassThrough({
      objectMode: true
    });
  };

  return noop.apply(this, arguments);
};

// Similar to `gulp.src()` but the pattern is relative to `SRC_DIR`
// and files are automatically watched when not in production mode.
var src = (function () {
  if (PRODUCTION)
  {
    return function src(pattern) {
      return gulp.src(pattern, {
        base: SRC_DIR,
        cwd: SRC_DIR,
      });
    };
  }

  // gulp-plumber prevents streams from disconnecting when errors.
  // See: https://gist.github.com/floatdrop/8269868#file-thoughts-md
  return function src(pattern) {
    return combine(
      gulp.src(pattern, {
        base: SRC_DIR,
        cwd: SRC_DIR,
      }),
      $.watch(pattern, {
        base: SRC_DIR,
        cwd: SRC_DIR,
      }),
      $.plumber()
    );
  };
})();

// Similar to `gulp.dest()` but the output directory is relative to
// `DIST_DIR` and default to `./`, and files are automatically live-
// reloaded when not in production mode.
var dest = (function () {
  var resolvePath = require('path').resolve;
  function resolve(path) {
    if (path) {
      return resolvePath(DIST_DIR, path);
    }
    return DIST_DIR;
  }

  if (PRODUCTION)
  {
    return function dest(path) {
      return gulp.dest(resolve(path));
    };
  }

  return function dest(path) {
    return combine(
      gulp.dest(resolve(path)),
      $.livereload(LIVERELOAD_PORT)
    );
  };
})();

//====================================================================

gulp.task('buildPages', function buildPages() {
  return src('index.jade')
    .pipe($.jade())
    .pipe(PRODUCTION ? noop() : $.embedlr({ port: LIVERELOAD_PORT }))
    .pipe(dest())
  ;
});

gulp.task('buildScripts', [
  'installBowerComponents',
], function buildScripts() {
  return browserify('./app', {
    // Extensions (other than “.js” and “.json”) to use.
    extensions: [
      '.coffee',
      '.jade',
    ],

    // Name of the UMD module to generate.
    //standalone: 'foo',

    transforms: [
      [{ global: true }, 'browserify-shim'],

      // require('template.jade')
      [{ global: true }, 'browserify-plain-jade'],

      // require('module.coffee')
      'coffeeify',

      // require('module-installed-via-bower')
      //'debowerify',

      // require('module-exposing-AMD interface')
      //'deamdify',

      // require('file.{html,css}')
      //'partialify',
    ],
  })
    // Annotate the code before minification (for Angular.js)
    .pipe(PRODUCTION ? $.ngAnnotate({
      add: true,
      'single_quotes': true,
    }) : noop())
    .pipe(PRODUCTION ? $.uglify() : noop())
    .pipe(dest())
  ;
});

gulp.task('buildStyles', [
  'installBowerComponents',
], function buildStyles() {
  return src('styles/main.scss')
    .pipe($.sass({
      includePaths: [
        BOWER_DIR,
      ],
    }))
    .pipe($.autoprefixer([
      'last 1 version',
      '> 1%',
    ]))
    .pipe(PRODUCTION ? $.csso() : noop())
    .pipe(dest())
  ;
});

gulp.task('copyAssets', [
  'installBowerComponents',
], function copyAssets() {
  var imgStream;
  if (PRODUCTION) {
    var imgFilter = $.filter('**/*.{gif,jpg,jpeg,png,svg}');

    imgStream = combine(
      imgFilter,
      $.imagemin({
        progressive: true,
      }),
      imgFilter.restore()
    );
  } else {
    imgStream = noop();
  }

  return src('{favicon.ico,images/**/*}')
    .pipe(imgStream)
    .pipe(dest())
  ;
});

gulp.task('installBowerComponents', function installBowerComponents(done) {
  require('bower').commands.install()
    .on('error', done)
    .on('end', function () {
      done();
    })
  ;
});

//--------------------------------------------------------------------

gulp.task('checkPages', function () {
  // TODO: Handle Jade.
  return gulp.src(SRC_DIR +'/**/*.html')
    .pipe($.htmlhint({
      'doctype-first': false, // Incorrect for partials.
      'img-alt-require': true,
    }))
    .pipe($.htmlhint.reporter())
  ;
});

gulp.task('checkScripts', function checkScripts() {
  return merge(
    // Disable for now due to issues with gulp-coffeelint.
    //gulp.src(SRC_DIR +'/**/*.coffee')
    //  .pipe($.coffeelint())
    //  .pipe($.coffeelint.reporter()),
    gulp.src(SRC_DIR +'/**/*.js')
      .pipe($.jsvalidate())
      .pipe($.jshint())
      .pipe($.jshint.reporter('jshint-stylish'))
  );
});

gulp.task('checkScripts', function checkScripts() {
  return gulp.src(SRC_DIR +'/**/*.js')
    .pipe($.jsvalidate())
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
  ;
});

//--------------------------------------------------------------------

gulp.task('build', [
  'buildPages',
  'buildScripts',
  'buildStyles',
  'copyAssets',
]);

gulp.task('check', [
  'checkPages',
  'checkScripts',
]);

gulp.task('clean', function clean(done) {
  require('rimraf')(DIST_DIR, done);
});

gulp.task('distclean', ['clean'], function distclean(done) {
  require('rimraf')(BOWER_DIR, done);
});

gulp.task('test', function test() {
  return gulp.src(SRC_DIR +'/**/*.spec.js')
    .pipe($.mocha({
      reporter: 'spec'
    }))
  ;
});

gulp.task('server', function server(done) {
  require('connect')()
    .use(require('serve-static')(DIST_DIR))
    .listen(SERVER_PORT, SERVER_ADDR, function serverOnListen() {
      var address = this.address();

      var port = address.port;
      address = address.address;

      // Correctly handle IPv6 addresses.
      if (address.indexOf(':') !== -1) {
        address = '['+ address +']';
      }

      console.log('Listening on http://'+ address +':'+ port);
    })
    .on('close', function serverOnClose() {
      done();
    })
  ;
});

//------------------------------------------------------------------------------

gulp.task('default', ['build']);
