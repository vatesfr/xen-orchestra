'use strict';

//====================================================================

var gulp = require('gulp');
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
var LIVERELOAD = 46417;

//--------------------------------------------------------------------

var pipe = function () {
  pipe = require('event-stream').pipe;
  return pipe.apply(this, arguments);
};

var concat = function () {
  concat = require('event-stream').concat;
  return concat.apply(this, arguments);
};

var gIf = function () {
  gIf = $.if;
  return gIf.apply(this, arguments);
};

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

var dest = (function () {
  if (PRODUCTION)
  {
    return function () {
      return gulp.dest(DIST_DIR);
    };
  }

  return function () {
    return pipe(
      gulp.dest(DIST_DIR),
      $.livereload(LIVERELOAD)
    );
  };
})();

//====================================================================

gulp.task('build-pages', function () {
  // TODO: Add minification (gulp-htmlmin).
  return concat(
    src('index.html').pipe(
      gIf(!PRODUCTION, $.embedlr({
        port: LIVERELOAD,
      }))
    ),
    src(['views/**/*.jade', '!**/_*']).pipe($.jade()),
    src('views/**/*.html')
  ).pipe(
    dest()
  );
});

gulp.task('build-scripts', function () {
  return concat(
    src('scripts/**/*.coffee').pipe($.coffee()),
    src('scripts/**/*.js')
  ).pipe(
    gIf(PRODUCTION, pipe(
      $.ngmin(),
      $.uglify()
    ))
  ).pipe(
    dest()
  );
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
  return concat(
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
