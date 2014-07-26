# xo-lib

[![Build Status](https://img.shields.io/travis/vatesfr/xo-lib/master.svg)](http://travis-ci.org/vatesfr/xo-lib)
[![Dependency Status](https://david-dm.org/vatesfr/xo-lib/status.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-lib)
[![devDependency Status](https://david-dm.org/vatesfr/xo-lib/dev-status.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-lib#info=devDependencies)

> Library to connect to XO-Server.


## Install

Download [manually](https://github.com/vatesfr/xo-lib/releases) or with package-manager.

#### [npm](https://npmjs.org/package/xo-lib)

```
npm install --save xo-lib
```

#### bower

```
bower install --save xo-lib
```

## Example

```javascript
var Xo = require('xo-lib');

var xo = new Xo('https://xo.company.tld/api/');

xo.call('session.signInWithPassword', {
  email: 'admin@admin.net',
  password: 'admin',
}).then(function () {
  return xo.call('session.getUser');
}).then(function (user) {
  console.log(user);

  xo.close();
});
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xo-lib/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Vates SAS](http://vates.fr)
