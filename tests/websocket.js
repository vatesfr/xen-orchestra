/* jshint loopfunc:false */

var assert = require('assert');
var sync = require('sync');
var WS = require('ws');

//////////////////////////////////////////////////////////////////////

var tests = {

	'Session management': {

		'Password sign in': function () {
			// Connects, signs in (with a password).
			var conn = this.connect();
			assert(conn('session.signInWithPassword', {
				'email': 'bob@gmail.com',
				'password': '123',
			}));
		},

		'Password sign in with a inexistent user': function() {
			// Connects
			var conn = this.connect();
			try
			{
				conn('session.signInWithPassword', {
					'email': ' @gmail.com',
					'password': '123',
				});
			}
			catch (e)
			{
				// Check the error.
				assert.strictEqual(e.code, 3);
				return;
			}

			assert(false);
		},

		/* jshint maxlen:90 */
		'Password sign in withan existing user and incorrect password': function () {
			// Connects
			var conn = this.connect();

			try
			{
				// Try to sign in (with password).
				conn('session.signInWithPassword', {
					'email': 'bob@gmail.com',
					'password': 'abc',
				});
			}
			catch (e)
			{
				// Check if received invalid credential error.
				assert.strictEqual(e.code, 3);
				return;
			}

			assert(false);
		},

		'Password sign in with user already authenticated': function() {
			// Connects, signs in (with a password).
			var conn = this.connect();
			conn('session.signInWithPassword', {
				'email': 'bob@gmail.com',
				'password': '123',
			});

			try
			{
				// Try to connect with other user account
				conn('session.signInWithPassword', {
					'email': 'toto@gmail.com',
					'password': '123',
				});
			}
			catch (e)
			{
				// Check if received already authenticated error.
				assert.strictEqual(e.code, 4);
				return;
			}

			assert(false);
		},
	},

	///////////////////////////////////////

	'Token management': {

		'Token sign in': function () {
			// Creates a token.
			var token = this.master('token.create');

			// Connects, signs in (with a token).
			var conn = this.connect();
			assert(conn('session.signInWithToken', {
				'token': token
			}));

			// Check if connected with the same user.
			assert.strictEqual(
				conn('session.getUserId'),
				this.master('session.getUserId')
			);
		},

		'Token sign in with invalid parameter': function() {
			// Connects.
			var conn = this.connect();
			try
			{
				// Try to sign in (with a token).
				conn('session.signInWithToken', {
					'token': ' ',
				});
			}
			catch (e)
			{
				// Check if received invalid credential error.
				assert.strictEqual(e.code, 3);
				return;
			}

			assert(false);
		},

		'Connection close out when token removed': function () {
			// Creates a token.
			var token = this.master('token.create');

			// Connects again and uses the token to sign in.
			var conn = this.connect();
			conn('session.signInWithToken', {'token': token});

			// Delete the tokens.
			conn('token.delete', {'token': token});

			// Checks the connection is closed.
			assert.throws(function () {
				conn('session.getUserId');
			});
		},
	},

	///////////////////////////////////////

	'User management': {

		'Create user': function() {
			// Connects, sign in (with a password).
			var conn = this.connect();
			conn('session.signInWithPassword', {
				'email': 'bob@gmail.com',
				'password': '123',
			});

			// Create a user account.
			assert(conn('user.create', {
				'email': 'tintin@gmail.com',
				'password': 'abc',
				'permission': 'none',
			}));
		},
	},

};

//////////////////////////////////////////////////////////////////////

var next_id = 0;
function call(method, params)
{
	return function (callback)
	{
		var request = {
			'jsonrpc': '2.0',
			'id': next_id++,
			'method': method,
			'params': params || {},
		};
		this.send(JSON.stringify(request), function (error) {
			if (error)
			{
				callback(error);
			}
		});

		this.once('message', function (response) {
			try
			{
				response = JSON.parse(response.toString());
			}
			catch (e)
			{
				callback(e);
				return;
			}

			if (response.error)
			{
				// To help find the problem, the request is included
				// in the error.
				var error = response.error;
				error.request = request;

				callback(error);
				return;
			}

			callback(null, response.result);
		});
	}.sync(this);
}

function connect(url)
{
	var socket;

	(function (callback)
	{
		socket = new WS(url);
		socket.on('open', function () {
			callback(null, socket);
		});
		socket.on('error', function (error) {
			callback(error);
		});
	}).sync();

	var conn = function (method, params) {
		return call.call(socket, method, params);
	};
	return conn;
}

//////////////////////////////////////////////////////////////////////

sync(function () {

	// All tests have access to this master connection to create
	// initial data.
	var master = connect('ws://localhost:8080/');
	master('session.signInWithPassword', {
		'email': 'bob@gmail.com',
		'password': '123',
	});

	var self = {
		'connect': function () {
			return connect('ws://localhost:8080/');
		},
		'master': master,
	};

	for (var category in tests)
	{
		console.log();
		console.log(category);
		console.log('====================');

		for (var test in tests[category])
		{
			console.log('- '+ test);

			var f = tests[category][test];
			try
			{
				f.call(self);
			}
			catch (error)
			{
				console.error(error);
			}
		}
	}
}, function () {
	process.exit();
});

