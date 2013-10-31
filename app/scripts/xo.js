/**
 * This file is a part of Xen Orchestra Web.
 *
 * Xen Orchestra Web is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * Xen Orchestra Web is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Xen Orchestra Web. If not, see
 * <http://www.gnu.org/licenses/>.
 *
 * @author Olivier Lambert <olivier.lambert@vates.fr>
 * @author Julien Fontanet <julien.fontanet@vates.fr>
 * @license http://www.gnu.org/licenses/agpl-3.0-standalone.html GNU AGPLv3
 *
 * @package Xen Orchestra Web
 */

//////////////////////////////////////////////////////////////////////
// Connection to XO.
//////////////////////////////////////////////////////////////////////
define([
	'q',
], function (Q) {
	'use strict';

	return function XO(url) {
		var xo = this;

		// Identifier of the next request.
		var next_id = 0;

		// Promises linked to the requests.
		var deferreds = {};

		// When the socket is closed, request are enqueued.
		var queue = [];

		// Websocket used to connect to XO-Server.
		var socket = new WebSocket(url);

		// Function used to send requests when the socket is opened.
		var send = function (method, params, deferred) {
			var id = next_id++;

			socket.send(JSON.stringify({
				'jsonrpc': '2.0',
				'id': id,
				'method': method,
				'params': params || [],
			}));

			deferreds[id] = deferred || Q.defer();
			return deferreds[id].promise;
		};

		// Function used to enqueue requests when the socket is closed.
		var enqueue = function (method, params) {
			var deferred = Q.defer();

			queue.push([method, params, deferred]);

			return deferred.promise;
		};

		// When the websocket opens, send any requests enqueued.
		socket.addEventListener('open', function () {
			// New requests are sent directly.
			xo.call = send;

			var query;
			while ( (query = queue.shift()) )
			{
				send(query[0], query[1], query[2]);
			}
		});

		// When the websocket closes, requests are not sent directly
		// but enqueud.
		socket.addEventListener('close', function () {
			xo.call = enqueue;
		});

		// When a message is received, we call the corresponding
		// deferred (if any).
		socket.addEventListener('message', function (event) {
			var response = JSON.parse(event.data);

			var id = response.id;
			var deferred = deferreds[id];
			delete deferreds[id];

			var error = response.error;
			if (undefined !== error)
			{
				deferred.reject(error);
				return;
			}

			var result = response.result;
			if (undefined === result)
			{
				/* jshint devel:true */
				deferred.reject({
					'message': 'a message with no error nor result has been' +
						' received',
					'object': response,
				});
				return;
			}

			deferred.resolve(result);
		});

		// @todo What to do if there is an error in the websocket.
		socket.addEventListener('error', function (error) {
			console.error(error);
		});

		// The default way to send a request is by enqueuing it.
		xo.call = enqueue;

		// @todo
		xo.clone = function () {
			return new XO(url);
		};
	};
});
