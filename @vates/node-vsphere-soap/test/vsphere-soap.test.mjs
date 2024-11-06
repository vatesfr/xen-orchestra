/*
  vsphere-soap.test.js

  tests for the vCenterConnectionInstance class
*/

import assert from 'assert'
import { describe, it } from 'node:test'

import * as vc from '../lib/client.mjs'

// eslint-disable-next-line n/no-missing-import
import { vCenterTestCreds as TestCreds } from '../config-test.mjs'

const VItest = new vc.Client(TestCreds.vCenterIP, TestCreds.vCenterUser, TestCreds.vCenterPassword, false)

describe('Client object initialization:', function () {
  it('provides a successful login', { timeout: 5000 }, function (t, done) {
    VItest.once('ready', function () {
      assert.notEqual(VItest.userName, null)
      assert.notEqual(VItest.fullName, null)
      assert.notEqual(VItest.serviceContent, null)
      done()
    }).once('error', function (err) {
      console.error(err)
      // this should fail if there's a problem
      assert.notEqual(VItest.userName, null)
      assert.notEqual(VItest.fullName, null)
      assert.notEqual(VItest.serviceContent, null)
      done()
    })
  })
})

describe('Client reconnection test:', function () {
  it('can successfully reconnect', { timeout: 5000 }, function (t, done) {
    VItest.runCommand('Logout', { _this: VItest.serviceContent.sessionManager })
      .once('result', function (result) {
        // now we're logged out, so let's try running a command to test automatic re-login
        VItest.runCommand('CurrentTime', { _this: 'ServiceInstance' })
          .once('result', function (result) {
            assert(result.returnval instanceof Date)
            done()
          })
          .once('error', function (err) {
            console.error(err)
          })
      })
      .once('error', function (err) {
        console.error(err)
      })
  })
})

// these tests don't work yet
describe('Client tests - query commands:', function () {
  it('retrieves current time', { timeout: 5000 }, function (t, done) {
    VItest.runCommand('CurrentTime', { _this: 'ServiceInstance' }).once('result', function (result) {
      assert(result.returnval instanceof Date)
      done()
    })
  })

  it('retrieves current time 2 (check for event clobbering)', { timeout: 5000 }, function (t, done) {
    VItest.runCommand('CurrentTime', { _this: 'ServiceInstance' }).once('result', function (result) {
      assert(result.returnval instanceof Date)
      done()
    })
  })

  it('can obtain the names of all Virtual Machines in the inventory', { timeout: 20000 }, function (t, done) {
    // get property collector
    const propertyCollector = VItest.serviceContent.propertyCollector
    // get view manager
    const viewManager = VItest.serviceContent.viewManager
    // get root folder
    const rootFolder = VItest.serviceContent.rootFolder

    let containerView, objectSpec, traversalSpec, propertySpec, propertyFilterSpec
    // this is the equivalent to
    VItest.runCommand('CreateContainerView', {
      _this: viewManager,
      container: rootFolder,
      type: ['VirtualMachine'],
      recursive: true,
    }).once('result', function (result) {
      // build all the data structures needed to query all the vm names
      containerView = result.returnval

      objectSpec = {
        attributes: { 'xsi:type': 'ObjectSpec' }, // setting attributes xsi:type is important or else the server may mis-recognize types!
        obj: containerView,
        skip: true,
      }

      traversalSpec = {
        attributes: { 'xsi:type': 'TraversalSpec' },
        name: 'traverseEntities',
        type: 'ContainerView',
        path: 'view',
        skip: false,
      }

      objectSpec = { ...objectSpec, selectSet: [traversalSpec] }

      propertySpec = {
        attributes: { 'xsi:type': 'PropertySpec' },
        type: 'VirtualMachine',
        pathSet: ['name'],
      }

      propertyFilterSpec = {
        attributes: { 'xsi:type': 'PropertyFilterSpec' },
        propSet: [propertySpec],
        objectSet: [objectSpec],
      }
      // TODO: research why it fails if propSet is declared after objectSet

      VItest.runCommand('RetrievePropertiesEx', {
        _this: propertyCollector,
        specSet: [propertyFilterSpec],
        options: { attributes: { type: 'RetrieveOptions' } },
      })
        .once('result', function (result, raw) {
          assert.notEqual(result.returnval.objects, null)
          if (Array.isArray(result.returnval.objects)) {
            assert.strictEqual(result.returnval.objects[0].obj.attributes.type, 'VirtualMachine')
          } else {
            assert.strictEqual(result.returnval.objects.obj.attributes.type, 'VirtualMachine')
          }
          done()
        })
        .once('error', function (err) {
          console.error('\n\nlast request : ' + VItest.client.lastRequest, err)
        })
    })
  })
})
