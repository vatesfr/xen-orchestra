/* jshint loopfunc:false */

var assert = require('assert');
var sync = require('sync');
var WS = require('ws');

//////////////////////////////////////////////////////////////////////

var tests = {

	'Session management': {

		'Password sign in': function () {
			var conn = this.connect('ws://localhost:8080/');
			assert(conn('session.signInWithPassword', {
				'email': 'bob@gmail.com',
				'password': '123',
			}));
		},

		'Token sign in': function () {
			assert(false);
		},

		'Connection close out when token removed': function () {
			// Connects, signs in (with a password) and creates a token.
			var conn = this.connect('ws://localhost:8080/');
			conn('session.signInWithPassword', {
				'email': 'bob@gmail.com',
				'password': '123',
			});
			var token = conn('token.create');

			// Connects again and uses the token to sign in.
			var conn2 = this.connect('ws://localhost:8080');
			conn2('session.signInWithToken', {'token': token});

			// Delete the tokens.
			conn('token.delete', {'token': token});

			// Checks the second connection is closed.
			assert.throws(function () {
				conn2('session.getUserId');
			});

			// Checks the first connection is still opened.
			conn('session.getUserId');
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
	for (var category in tests)
	{
		console.log(category);
		console.log('====================');

		for (var test in tests[category])
		{
			console.log('- '+ test);

			var f = tests[category][test];
			try
			{
				f.call({
					'connect': connect,
				});
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
