# xo-server-backup-reports [![Build Status](https://api.travis-ci.org/vatesfr/xo-server-backup-reports.png?branch=master)](https://travis-ci.org/vatesfr/xo-server-backup-reports)

> Backup reports plugin for XO-Server

XO-Server plugin which sends email reports when backup jobs are done.
 
## Install

Go inside your `xo-server` folder and install it:

```
> npm install xo-server-backup-reports
```

## Usage

### Prerequisite

You must have the [xo-server-transport-email](https://github.com/vatesfr/xo-server-transport-email) plugin enabled to use xo-server-backup-reports.

### Add the plugin to XO-Server config

```yaml
plugins:

  xo-server-backup-reports:
```

## Development

### Installing dependencies

```
> npm install
```

### Compilation

The sources files are watched and automatically recompiled on changes.

```
> npm run dev
```

### Tests

```
> npm run test-dev
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xo-server-backup-reports/issues)
  you've encountered;
- fork and create a pull request.

## License

AGPL3 © [Vates SAS](http://vates.fr)
