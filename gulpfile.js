'use strict';

//====================================================================

var gulp = require('gulp');

//====================================================================

var options = require('minimist')(process.argv, {
  boolean: ['production'],

  default: {
    production: false,
  }
});

//====================================================================

var BOWER_DIR = __dirname +'/dist/bower_components';
var DIST_DIR = __dirname +'/dist';
var SRC_DIR = __dirname +'/app';

var PRODUCTION = options.production;
var LIVERELOAD = 46417;

//--------------------------------------------------------------------

var combine = function () {
  combine = require('stream-combiner');
  return combine.apply(this, arguments);
};

var concat = function () {
  concat = require('event-stream').concat;
  return concat.apply(this, arguments);
};

var gIf = function () {
  gIf = require('gulp-if');
  return gIf.apply(this, arguments);
};

var src = (function () {
  if (PRODUCTION)
  {
    return function (pattern) {
      return gulp.src(SRC_DIR +'/'+ pattern, {
        base: SRC_DIR,
      });
    };
  }

  // Requires dependencies only when necessary (and only once).
  return function () {
    // gulp-plumber prevents streams from disconnecting when errors.
    // See: https://gist.github.com/floatdrop/8269868#file-thoughts-md
    var plumber = require('gulp-plumber');

    var watch = require('gulp-watch');

    src = function (pattern) {
      return watch({
        glob: SRC_DIR +'/'+ pattern,
        base: SRC_DIR,
      }).pipe(plumber({
        errorHandler: console.error,
      }));
    };

    return src.apply(this, arguments);
  };
})();

var dest = (function () {
  if (PRODUCTION)
  {
    return function () {
      return gulp.dest(DIST_DIR);
    };
  }

  // Requires dependencies only when necessary (and only once).
  return function () {
    // The tiny-lr server is automatically instantiated by livereload.
    var livereload = require('gulp-livereload');

    dest = function () {
      return combine(
        gulp.dest(DIST_DIR),
        livereload(LIVERELOAD)
      );
    };

    return dest();
  };
})();

//====================================================================

gulp.task('build-pages', function () {
  // TODO: Add minification (gulp-htmlmin).
  return concat(
    src('index.html').pipe(
      gIf(!PRODUCTION, require('gulp-embedlr')({
        port: LIVERELOAD,
      }))
    ),
    src('views/**/*.jade').pipe(require('gulp-jade')()),
    src('views/**/*.html')
  ).pipe(
    dest()
  );
});

gulp.task('build-scripts', function () {
  return concat(
    src('scripts/**/*.coffee').pipe(require('gulp-coffee')()),
    src('scripts/**/*.js')
  ).pipe(
    gIf(PRODUCTION, combine(
      require('gulp-ngmin')(),
      require('gulp-uglify')()
    ))
  ).pipe(
    dest()
  );
});

gulp.task('build-styles', ['install-bower-components'], function () {
  return src('styles/main.sass').pipe(
    require('gulp-ruby-sass')({
      loadPath: [
        BOWER_DIR
      ],
      //outputStyle: 'compressed',
    })
  ).pipe(gulp.dest(DIST_DIR +'/styles'));
  // FIXME: Cannot use dest() because gulp-ruby-sass does not honor
  // basedir.
});

gulp.task('copy-assets', function () {
  return src('{favicon.ico,images/**/*}').pipe(
    dest()
  );
});

gulp.task('install-bower-components', function (done) {
  var bower = require('bower');

  bower.config.cwd = __dirname;
  bower.config.directory = require('path').relative(__dirname, BOWER_DIR);

  bower.commands.install()
    .on('error', done)
    .on('end', function () {
      done();
    });
});

//--------------------------------------------------------------------

gulp.task('check-pages', function () {
  var htmlhint = require('gulp-htmlhint');

  // TODO: Handle Jade.
  return gulp.src(SRC_DIR +'/**/*.html')
    .pipe(htmlhint({
      'doctype-first': false, // Incorrect for partials.
      'img-alt-require': true,
    }))
    .pipe(htmlhint.reporter())
  ;
});

gulp.task('check-scripts', function () {
  var coffeelint = require('gulp-coffeelint');
  var jshint = require('gulp-jshint');

  return combine(
    gulp.src(SRC_DIR +'/**/*.coffee')
      .pipe(coffeelint())
      .pipe(coffeelint.reporter()),
    gulp.src(SRC_DIR +'/**/*.js')
      .pipe(require('gulp-jsvalidate')())
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish'))
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
  }).pipe(require('gulp-clean')());
});

gulp.task('distclean', ['clean'], function () {
  return gulp.src(BOWER_DIR, {
    read: false,
  }).pipe(require('gulp-clean')());
});

gulp.task('test', function () {
  return gulp.src(SRC_DIR +'/**/*.spec.js')
    .pipe(require('gulp-mocha')({
      reporter: 'spec'
    }));
});

//------------------------------------------------------------------------------

gulp.task('default', ['build']);
