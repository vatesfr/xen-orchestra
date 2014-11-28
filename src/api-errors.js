'use strict';

//====================================================================

var assign = require('lodash.assign');
var JsonRpcError = require('json-rpc/errors').JsonRpcError;
var jsonRpcErrors = require('json-rpc/errors');
var makeError = require('make-error');

//====================================================================

function exportError(constructor) {
	makeError(constructor, JsonRpcError);
	exports[constructor.name] = constructor;
}

//====================================================================

// Export standard JSON-RPC errors.
assign(exports, jsonRpcErrors);

//--------------------------------------------------------------------

exportError(function NotImplemented() {
	NotImplemented.super.call(this, 'not implemented', 0);
});

//--------------------------------------------------------------------

exportError(function NoSuchObject() {
	NoSuchObject.super.call(this, 'no such object', 1);
});

//--------------------------------------------------------------------

exportError(function Unauthorized() {
	Unauthorized.super.call(
		this,
		'not authenticated or not enough permissions',
		2
	);
});

//--------------------------------------------------------------------

exportError(function InvalidCredential() {
	InvalidCredential.super.call(this, 'invalid credential', 3);
});

//--------------------------------------------------------------------

exportError(function AlreadyAuthenticated() {
	AlreadyAuthenticated.super.call(this, 'already authenticated', 4);
});
