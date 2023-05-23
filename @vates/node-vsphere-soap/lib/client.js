/*

  node-vsphere-soap

  client.js

  This file creates the Client class

  - when the class is instantiated, a connection will be made to the ESXi/vCenter server to verify that the creds are good
  - upon a bad login, the connnection will be terminated

*/

var EventEmitter = require('events').EventEmitter,
  util = require('util'),
  soap = require('soap'),
  cookie = require('soap-cookie'),   // required for session persistence
  constants = require('constants'),
  _ = require('lodash');


// Client class
// inherits from EventEmitter
// possible events: connect, error, ready

function Client( vCenterHostname, username, password, sslVerify) {

  this.status = 'disconnected';
  this.reconnectCount = 0;

  sslVerify = typeof sslVerify !== 'undefined' ? sslVerify : false;

  var self = this;

  EventEmitter.call( this );

  // sslVerify argument handling
  if(sslVerify) {
    this.clientopts = {};
  } else {
    this.clientopts = {
      rejectUnauthorized: false,
      strictSSL: false,
      secureOptions: constants.SSL_OP_NO_TLSv1_2 // likely needed for node >= 10.0
    }; // recommended options by node-soap authors
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // need for self-signed certs
  }

  this.connectionInfo = {
    'host' : vCenterHostname,
    'user' : username,
    'password' : password,
    'sslVerify' : sslVerify
  };

  this._loginArgs = {
    userName: this.connectionInfo.user,
    password: this.connectionInfo.password,
  };

  this._vcUrl = 'https://' + this.connectionInfo.host + '/sdk/vimService.wsdl';

  // connect to the vCenter / ESXi host
  this.on('connect', this._connect );
  this.emit('connect');

  // close session
  this.on('close', this._close);

  return this;

};

util.inherits(Client, EventEmitter);

Client.prototype.runCommand = function (command, arguments) {

  var self = this;
  var cmdargs;
  if(!arguments || arguments == null) {
    cmdargs = {};
  } else {
    cmdargs = arguments;
  }

  var emitter = new EventEmitter;

  // check if client has successfully connected
  if( self.status == 'ready' || self.status == 'connecting') {
    self.client.VimService.VimPort[command]( cmdargs, function ( err, result, raw, soapHeader) {
      if( err ) { 
        _soapErrorHandler( self, emitter, command, cmdargs, err );
      }
      if( command == 'Logout') {
        self.status = 'disconnected';
        process.removeAllListeners('beforeExit');
      }
      emitter.emit('result', result, raw, soapHeader);
    });
  } else {
    // if connection not ready or connecting, reconnect to instance
    if( self.status == 'disconnected' ) {
      self.emit('connect');
    }
    self.once('ready', function () {
      self.client.VimService.VimPort[command]( cmdargs, function ( err, result, raw, soapHeader) {
        if( err ) { 
          _soapErrorHandler( self, emitter, command, cmdargs, err );
        }
        if( command == 'Logout') {
          self.status = 'disconnected';
          process.removeAllListeners('beforeExit');
        }
        emitter.emit('result', result, raw, soapHeader);
      });
    });
  }

  return emitter;

};

Client.prototype.close = function () {

  var self = this;

  self.emit('close');

};

Client.prototype._connect = function () {

  var self = this;

  if(self.status != 'disconnected') {
    return;
  }

  self.status = 'connecting';

  soap.createClient(self._vcUrl, self.clientopts, function (err, client) {
    if( err ) { 
      self.emit('error',err);
      throw err;
    }

    self.client = client; // save client for later use

    self.runCommand('RetrieveServiceContent', { _this: 'ServiceInstance' })
    .once('result', function (result, raw, soapHeader) {

      if( !result.returnval ) {
        self.status = 'disconnected';
        self.emit('error', raw);
        return;
      }

      self.serviceContent = result.returnval;
      self.sessionManager = result.returnval.sessionManager;
      var loginArgs = _.assign({ _this: self.sessionManager }, self._loginArgs);

      self.runCommand('Login', loginArgs)
      .once('result', function (result, raw, soapHeader) {

        self.authCookie = new cookie(client.lastResponseHeaders);
        self.client.setSecurity(self.authCookie); // needed since vSphere SOAP WS uses cookies

        self.userName = result.returnval.userName;
        self.fullName = result.returnval.fullName;  
        self.reconnectCount = 0;        

        self.status = 'ready';
        self.emit('ready');
        process.once('beforeExit', self._close );
      })
      .once('error', function (err) {
        self.status = 'disconnected';
        self.emit('error', err);
      });
    })
    .once('error', function (err) {
      self.status = 'disconnected';
      self.emit('error', err);
    });
  }, self._vcUrl);

};

Client.prototype._close = function () {

  var self = this;

  if(self.status == 'ready') {
    self.runCommand('Logout', { _this: self.sessionManager })
    .once('result', function (result) {
      self.status = 'disconnected';
      //console.log(result);
    })
    .once('error', function (err) {
      console.error(err);
    });
  } else {
    self.status = 'disconnected';
  }

};

function _soapErrorHandler( self, emitter, command, arguments, err ) {

  if(err) {
    console.error('error contents : ' + err.body);
  } else {
    err = { body: 'general error' };
  }

  if(err.body.match( /session is not authenticated/ ) ) {
    console.log('authorization token expired! reconnecting...');
    self.status = 'disconnected';
    process.removeAllListeners('beforeExit');

    if(self.reconnectCount < 10) {
      self.reconnectCount += 1;
      self.runCommand(command, arguments)
      .once('result', function (result, raw, soapHeader) {
        emitter.emit('result', result, raw, soapHeader)
      })
      .once('error', function (err) {
        emitter.emit('error',err.body);
        throw err;
      });
    } else {
      emitter.emit('error',err.body);
      throw err;
    }
  } else {
    emitter.emit('error',err.body);
    throw err;
  }

};

// end
exports.Client = Client;


