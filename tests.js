var $mocha = require('mocha');

var $glob = require('glob');

require('coffee-script');

//====================================================================

var mocha = new $mocha({
  reporter: 'spec',
});

var argv = process.argv;
for (var i = 2, n = argv.length; i < n; ++i) {
  mocha.grep(new RegExp(argv[i]));
}

$glob('src/**/*.spec.coffee', function (error, files) {
  if (error) {
    console.error(error) ;
  }

  files.forEach(function (file) {
    mocha.addFile(file);
  });

  $glob('src/**/*.spec.js', function (error, files) {
    if (error) {
      console.error(error) ;
    }

    files.forEach(function (file) {
      mocha.addFile(file);
    });

    mocha.run();
  });
});
