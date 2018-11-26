# xo-test [![Build Status](https://travis-ci.org/vatesfr/xo-test.png?branch=master)](https://travis-ci.org/vatesfr/xo-test)

> Test client for Xo-Server

## Usage

xo-server needs to be installed on `localhost:9000`.
You should also have a `admin@admin.net` account with password `admin`.

There should be a Xen Server available at `192.168.1.3`with the credentials `root` and password `qwerty`.

Warning ! This client will create and delete a lot of items (users, groups, servers ...) to test features

```
> npm ci
> npm test
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xo-test/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Vates SAS](http://vates.fr)
