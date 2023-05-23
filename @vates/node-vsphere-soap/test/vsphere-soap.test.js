/*
  vsphere-soap.test.js

  tests for the vCenterConnectionInstance class
*/ 

var Code = require('code');
var Lab = require('lab');
var util = require('util');
var lab = exports.lab = Lab.script();
var vc = require('../lib/client');
var TestCreds = require('../config-test.js').vCenterTestCreds
var _ = require('lodash');


var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = Code.expect;

var VItest = new vc.Client(TestCreds.vCenterIP, TestCreds.vCenterUser, TestCreds.vCenterPassword, false);

describe('Client object initialization:', function () {
  it('provides a successful login', {timeout: 5000}, function (done) {
    
    VItest.once('ready', function () {
      expect(VItest.userName).to.exist();
      //console.log('logged in user : ' + VItest.userName);
      expect(VItest.fullName).to.exist();
      //console.log('logged in user fullname : ' + VItest.fullName);
      expect(VItest.serviceContent).to.exist();
      //console.log(VItest.serviceContent);
      done();

    })
    .once('error', function (err) {
      
      console.error(err);
      // this should fail if there's a problem
      expect(VItest.userName).to.exist();
      //console.log('logged in user : ' + VItest.userName);
      expect(VItest.fullName).to.exist();
      //console.log('logged in user fullname : ' + VItest.fullName);
      expect(VItest.serviceContent).to.exist();
      //console.log(VItest.serviceContent);
      done();
    });
  });
});

describe('Client reconnection test:', function () {

  it('can successfully reconnect', {timeout: 5000}, function (done) {

    VItest.runCommand('Logout', { _this: VItest.serviceContent.sessionManager })
      .once('result', function (result){
        // now we're logged out, so let's try running a command to test automatic re-login
        VItest.runCommand('CurrentTime', { _this: 'ServiceInstance'} )
          .once('result', function (result) {
            expect(result.returnval).to.be.a.date();
            done();
          })
          .once('error', function (err) {
            console.error(err);
          });
      })
      .once('error', function (err) {
        console.error(err);
      });
  });
});

// these tests don't work yet
describe('Client tests - query commands:', function (){

  it('retrieves current time', {timeout: 5000}, function (done){

    VItest.runCommand('CurrentTime', { _this: 'ServiceInstance'} )
      .once('result', function (result){
        expect(result.returnval).to.be.a.date();
        done();
    });
  }); 

  it('retrieves current time 2 (check for event clobbering)', {timeout: 5000}, function (done){

    VItest.runCommand('CurrentTime', { _this: 'ServiceInstance'} )
      .once('result', function (result){
        expect(result.returnval).to.be.a.date();
        done();
    });
  }); 

  it('can obtain the names of all Virtual Machines in the inventory', {timeout: 20000}, function (done){
    // get property collector
    var propertyCollector = VItest.serviceContent.propertyCollector;
    // get view manager
    var viewManager = VItest.serviceContent.viewManager;
    // get root folder
    var rootFolder = VItest.serviceContent.rootFolder;

    var containerView,
      objectSpec,
      traversalSpec,
      propertySpec,
      propertyFilterSpec;
    // this is the equivalent to 
    VItest.runCommand('CreateContainerView', { _this: viewManager, container: rootFolder, type: ['VirtualMachine'], recursive: true})
    .once('result', function (result){

      // build all the data structures needed to query all the vm names
      containerView = result.returnval;

      objectSpec = {
        attributes: { 'xsi:type': 'ObjectSpec'}, // setting attributes xsi:type is important or else the server may mis-recognize types!
        obj: containerView,
        skip: true
      };

      traversalSpec = {
        attributes: { 'xsi:type': 'TraversalSpec'}, 
        name: 'traverseEntities', 
        type: 'ContainerView', 
        path: 'view', 
        skip: false, 
      };
      
      objectSpec = _.assign(
        objectSpec,
        { selectSet: [ traversalSpec ] }
      );
      
      propertySpec = {
        attributes: { 'xsi:type': 'PropertySpec'},
        type: 'VirtualMachine',
        pathSet: ['name']
      };

      propertyFilterSpec = {
        attributes: { 'xsi:type': 'PropertyFilterSpec'},
        propSet: [ propertySpec ],
        objectSet: [ objectSpec ]
      };
      // TODO: research why it fails if propSet is declared after objectSet

      VItest.runCommand('RetrievePropertiesEx', { _this: propertyCollector, specSet: [ propertyFilterSpec ], options: {attributes: {type:'RetrieveOptions'}} })
      .once('result', function (result, raw){

        expect(result.returnval.objects).to.exist();
        if( _.isArray(result.returnval.objects) ) {
          expect( _.sample(result.returnval.objects).obj.attributes.type).to.be.equal('VirtualMachine');
        } else {
          expect(result.returnval.objects.obj.attributes.type).to.be.equal('VirtualMachine');
        }
        done();
      })
      .once('error', function (err){
        console.log('\n\nlast request : ' + VItest.client.lastRequest);
      });

    });

  });
});
