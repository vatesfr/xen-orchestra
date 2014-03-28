# XO CLI
[![Build Status](https://img.shields.io/travis/vatesfr/xo-cli/master.svg)](http://travis-ci.org/vatesfr/xo-cli)
[![Dependency Status](https://david-dm.org/vatesfr/xo-cli/status.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-cli)
[![devDependency Status](https://david-dm.org/vatesfr/xo-cli/dev-status.svg?theme=shields.io)](https://david-dm.org/vatesfr/xo-cli#info=devDependencies)

> Basic CLI for Xen-Orchestra

## Installation

#### [npm](https://npmjs.org/package/xo-cli)

```
npm install -g xo-cli
```

## Usage

#### Register your XO instance

```
xo-cli register --host http://xo.my-company.net/api/ --email admin@admin.net --password admin
```

Note: only a token will be saved in the configuration file.

#### Adds a new Xen server


```
xo-cli add-server --host xen1.my-company.net --user root --password secure%password
```
