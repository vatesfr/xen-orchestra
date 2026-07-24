'use strict'

// This should be require first, otherwise fs-promise does not use it.
const mock = require('mock-fs')

const { afterEach, beforeEach, describe, it } = require('node:test')
const assert = require('assert')
const { join } = require('path')
const homedir = require('os').homedir

const loadConfig = require('.').load

// ===================================================================

describe('appConf', function () {
  beforeEach(function () {
    mock({
      // Vendor config
      '../../config.json': '{ "vendor": true, "foo": "vendor" }',

      // System
      '/etc/test-app-conf/config.json': '{ "system": true, "foo": "system" }',

      // Global (user configuration)
      // TODO

      // Local
      '../.test-app-conf.json': '{ "local.1": true, "foo": "local.1" }',
      '.test-app-conf.json': '{ "local.0": true, "foo": "local.0" }',

      // Special vendor file to test paths resolution.
      '../../config.paths-resolution.json': mock.symlink({
        path: '/etc/paths-resolution.json',
      }),
      '/etc/paths-resolution.json': JSON.stringify({
        pathWithCurrent: './foo',
        pathWithHome: '~/bar',
        pathWithParent: '../baz',
      }),
    })
  })

  afterEach(function () {
    mock.restore()
  })

  describe('#load()', function () {
    it('works', function () {
      return loadConfig('test-app-conf', {
        appDir: '../..',
      }).then(function (config) {
        assert.deepStrictEqual(config, {
          'local.0': true,
          'local.1': true,
          system: true,
          vendor: true,

          foo: 'local.0',

          pathWithCurrent: '/etc/foo',
          pathWithHome: homedir() + '/bar',
          pathWithParent: '/baz',
        })
      })
    })

    it('can load only specific entries', function () {
      return loadConfig('test-app-conf', {
        entries: ['local', 'system'],
      }).then(function (config) {
        assert.deepStrictEqual(config, {
          'local.0': true,
          'local.1': true,
          system: true,

          // merging order is still the same though
          foo: 'local.0',
        })
      })
    })

    describe('env overrides', function () {
      let savedEnv
      beforeEach(function () {
        savedEnv = { ...process.env }
      })
      afterEach(function () {
        for (const key of Object.keys(process.env)) {
          if (!(key in savedEnv)) delete process.env[key]
        }
        Object.assign(process.env, savedEnv)
      })

      it('overrides config values via env vars (derived prefix)', function () {
        process.env.TEST_APP_CONF_foo = 'from-env'
        return loadConfig('test-app-conf', { appDir: '../..' }).then(function (config) {
          assert.strictEqual(config.foo, 'from-env')
        })
      })

      it('supports nested keys via __ separator', function () {
        process.env.TEST_APP_CONF_database__host = 'db.example.com'
        return loadConfig('test-app-conf').then(function (config) {
          assert.deepStrictEqual(config.database, { host: 'db.example.com' })
        })
      })

      it('accepts a custom envPrefix', function () {
        process.env.MY_APP_foo = 'custom-prefix'
        return loadConfig('test-app-conf', { envPrefix: 'MY_APP_' }).then(function (config) {
          assert.strictEqual(config.foo, 'custom-prefix')
        })
      })

      it('disables env overrides when envPrefix is false', function () {
        process.env.TEST_APP_CONF_foo = 'from-env'
        return loadConfig('test-app-conf', {
          appDir: '../..',
          envPrefix: false,
        }).then(function (config) {
          assert.strictEqual(config.foo, 'local.0')
        })
      })

      it('parses json: prefixed values', function () {
        process.env.TEST_APP_CONF_port = 'json:5432'
        process.env.TEST_APP_CONF_enabled = 'json:true'
        process.env.TEST_APP_CONF_tags = 'json:["a","b"]'
        return loadConfig('test-app-conf').then(function (config) {
          assert.strictEqual(config.port, 5432)
          assert.strictEqual(config.enabled, true)
          assert.deepStrictEqual(config.tags, ['a', 'b'])
        })
      })

      it('keeps non-json: values as strings', function () {
        process.env.TEST_APP_CONF_port = '5432'
        return loadConfig('test-app-conf').then(function (config) {
          assert.strictEqual(config.port, '5432')
        })
      })

      it('throws on malformed json: values', function () {
        process.env.TEST_APP_CONF_bad = 'json:[invalid'
        return assert.rejects(() => loadConfig('test-app-conf'))
      })

      it("disables env overrides when 'env' is excluded from entries", function () {
        process.env.TEST_APP_CONF_foo = 'from-env'
        return loadConfig('test-app-conf', {
          appDir: '../..',
          entries: ['vendor', 'system', 'global', 'local'],
        }).then(function (config) {
          assert.strictEqual(config.foo, 'local.0')
        })
      })
    })

    describe('global config', function () {
      let savedXdg, savedAppdata
      beforeEach(function () {
        savedXdg = process.env.XDG_CONFIG_HOME
        savedAppdata = process.env.APPDATA
      })
      afterEach(function () {
        mock.restore()
        if (savedXdg === undefined) delete process.env.XDG_CONFIG_HOME
        else process.env.XDG_CONFIG_HOME = savedXdg
        if (savedAppdata === undefined) delete process.env.APPDATA
        else process.env.APPDATA = savedAppdata
      })

      it('reads from XDG_CONFIG_HOME when set', function () {
        process.env.XDG_CONFIG_HOME = '/custom-xdg'
        delete process.env.APPDATA
        mock({ '/custom-xdg/test-app-conf/config.json': '{ "global": true }' })
        return loadConfig('test-app-conf', { entries: ['global'] }).then(function (config) {
          assert.deepStrictEqual(config, { global: true })
        })
      })

      it('falls back to ~/.config when XDG_CONFIG_HOME is not set', function () {
        delete process.env.XDG_CONFIG_HOME
        delete process.env.APPDATA
        mock({
          [join(homedir(), '.config', 'test-app-conf', 'config.json')]: '{ "global": true }',
        })
        return loadConfig('test-app-conf', { entries: ['global'] }).then(function (config) {
          assert.deepStrictEqual(config, { global: true })
        })
      })

      it('XDG_CONFIG_HOME takes precedence over ~/.config', function () {
        process.env.XDG_CONFIG_HOME = '/custom-xdg'
        delete process.env.APPDATA
        mock({
          '/custom-xdg/test-app-conf/config.json': '{ "source": "xdg" }',
          [join(homedir(), '.config', 'test-app-conf', 'config.json')]: '{ "source": "home" }',
        })
        return loadConfig('test-app-conf', { entries: ['global'] }).then(function (config) {
          assert.strictEqual(config.source, 'xdg')
        })
      })
    })
  })
})
