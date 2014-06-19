'use strict';

//====================================================================

var gulp = require('gulp');

// All plugins are loaded (on demand) by gulp-load-plugins.
var $ = require('gulp-load-plugins')();

//====================================================================

var options = require('minimist')(process.argv, {
  boolean: ['production'],

  default: {
    production: false,
  }
});

//====================================================================

var DIST_DIR = __dirname +'/dist';
var SRC_DIR = __dirname +'/app';

// Bower directory is read from its configuration.
var BOWER_DIR = (function () {
  var cfg;

  try
  {
    cfg = JSON.parse(require('fs').readFileSync('./.bowerrc'));
  }
  catch (error)
  {
    cfg = {};
  }

  cfg.cwd || (cfg.cwd = __dirname);
  cfg.directory || (cfg.directory = 'bower_components');

  return cfg.cwd +'/'+ cfg.directory;
})();

var PRODUCTION = options.production;

// Port to use for the livereload server.
//
// It must be available and if possible unique to not conflict with
// other projects.
// http://www.random.org/integers/?num=1&min=1024&max=65535&col=1&base=10&format=plain&rnd=new
var LIVERELOAD_PORT = 46417;

//--------------------------------------------------------------------

// Browserify plugin for gulp.js which uses watchify in development
// mode.
var browserify = function (path, opts) {
  opts || (opts = {});

  var bundler = require(PRODUCTION ? 'browserify' : 'watchify')({
    entries: [path],
    extensions: opts.extensions,
  });
  if (opts.transforms)
  {
    [].concat(opts.transforms).forEach(function (transform) {
      bundler.transform(transform);
    });
  }

  // Append the extension if necessary.
  if (!/\.js$/.test(path))
  {
    path += '.js';
  }
  var file = new (require('vinyl'))({
    base: opts.base,
    path: require('path').resolve(path),
  });

  var stream = new require('stream').Readable({
    objectMode: true,
  });

  var bundle = bundler.bundle.bind(bundler, {
    debug: opts.debug,
    standalone: opts.standalone,
  }, function (error, bundle) {
    if (error)
    {
      console.warn(error.stack || error);
      return;
    }

    file.contents = new Buffer(bundle);
    stream.push(file);

    // EOF is sent only in production.
    if (PRODUCTION)
    {
      stream.push(null);
    }
  });

  stream._read = function () {
    // Ignore subsequent reads.
    stream._read = function () {};

    // Register for updates (does nothing if we are not using
    // Browserify, in production).
    bundler.on('update', bundle);

    bundle();
  };
  return stream;
};

// Combine multiple streams together and can be handled as a single
// stream.
var combine = function () {
  // `event-stream` is required only when necessary to maximize
  // performance.
  combine = require('event-stream').pipe;
  return combine.apply(this, arguments);
};

// Merge multiple readble streams into a single one.
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
    return function (pattern) {
      return gulp.src(pattern, {
        base: SRC_DIR,
        cwd: SRC_DIR,
      });
    };
  }

  // gulp-plumber prevents streams from disconnecting when errors.
  // See: https://gist.github.com/floatdrop/8269868#file-thoughts-md
  return function (pattern) {
    return gulp.src(pattern, {
      base: SRC_DIR,
      cwd: SRC_DIR,
    }).pipe(
      $.watch()
    ).pipe(
      $.plumber({
        errorHandler: console.error,
      })
    );
  };
})();

// Similar to `gulp.dst()` but the output directory is always
// `DIST_DIR` and files are automatically live-reloaded when not in
// production mode.
var dest = (function () {
  if (PRODUCTION)
  {
    return function () {
      return gulp.dest(DIST_DIR);
    };
  }

  return function () {
    return combine(
      gulp.dest(DIST_DIR),
      $.livereload(LIVERELOAD_PORT)
    );
  };
})();

//====================================================================

gulp.task('build-pages', function () {
  return src('index.jade').pipe($.jade()).pipe(
    PRODUCTION ? noop() : $.embedlr({
      port: LIVERELOAD_PORT,
    })
  ).pipe(
    dest()
  );
});

gulp.task('build-scripts', ['install-bower-components'], function () {
  return browserify(SRC_DIR +'/app', {
    // Base path to use for modules starting with “./”.
    base: SRC_DIR,

    // Whether to generate a sourcemap.
    debug: !PRODUCTION,

    // Extensions (other than “js” and “json”) to use.
    extensions: [
      '.coffee',
      '.jade',
    ],

    // Name of the UMD module ot generate.
    //standalone: 'foo',

    transforms: [
      // require('template.jade')
      'browserify-plain-jade',

      // require('module.coffee')
      'coffeeify',

      // require('module-installed-via-bower')
      'debowerify',
    ],
  })
    // .pipe(PRODUCTION ? $.uglify() : noop())
    .pipe(dest())
  ;
});

gulp.task('build-styles', ['install-bower-components'], function () {
  return src('styles/main.sass').pipe(
    $.rubySass({
      loadPath: [
        BOWER_DIR,

        // Bug in gulp-ruby-sass, local directory should be in the
        // include path.
        SRC_DIR +'/styles'
      ]
    })
  ).pipe(dest());
});

gulp.task('copy-assets', ['install-bower-components'], function () {
  return src('{favicon.ico,images/**/*}').pipe(
    dest()
  );
});

gulp.task('install-bower-components', function (done) {
  require('bower').commands.install()
    .on('error', done)
    .on('end', function () {
      done();
    });
});

//--------------------------------------------------------------------

gulp.task('check-pages', function () {
  // TODO: Handle Jade.
  return gulp.src(SRC_DIR +'/**/*.html')
    .pipe($.htmlhint({
      'doctype-first': false, // Incorrect for partials.
      'img-alt-require': true,
    }))
    .pipe($.htmlhint.reporter())
  ;
});

gulp.task('check-scripts', function () {
  return merge(
    gulp.src(SRC_DIR +'/**/*.coffee')
      .pipe($.coffeelint())
      .pipe($.coffeelint.reporter()),
    gulp.src(SRC_DIR +'/**/*.js')
      .pipe($.jsvalidate())
      .pipe($.jshint())
      .pipe($.jshint.reporter('jshint-stylish'))
  );
});

//--------------------------------------------------------------------

gulp.task('build', [
  'build-pages',
  'build-scripts',
  'build-styles',
  'copy-assets',
]);

gulp.task('check', [
  'check-pages',
  'check-scripts',
]);

gulp.task('clean', function () {
  return gulp.src(DIST_DIR, {
    read: false,
  }).pipe($.clean());
});

gulp.task('distclean', ['clean'], function () {
  return gulp.src(BOWER_DIR, {
    read: false,
  }).pipe($.clean());
});

gulp.task('test', function () {
  return gulp.src(SRC_DIR +'/**/*.spec.js')
    .pipe($.mocha({
      reporter: 'spec'
    }));
});

//------------------------------------------------------------------------------

gulp.task('default', ['build']);
