'use strict';

//====================================================================

var formatQueryString = require('querystring').stringify;
var httpRequest = require('http').request;
var httpsRequest = require('https').request;
var parseUrl = require('url').parse;

var assign = require('lodash.assign');
var debug = require('debug')('xo:proxyRequest');
var forEach = require('lodash.foreach');
var isString = require('lodash.isstring');

//====================================================================

var DEFAULTS = {
	method: 'GET',
};

var HTTP_RE = /^http(s?):?$/;

//====================================================================

function proxyRequest(opts, upReq, upRes) {
	if (isString(opts)) {
		debug('parsing URL %s', opts);

		opts = parseUrl(opts);
	}

	// Merges options with defaults.
	opts = assign({}, DEFAULTS, {
		method: upReq.method,
	}, opts);

	opts.headers = assign({},
		DEFAULTS.headers,
		upReq.headers,
		{
			connection: 'close',
			host: opts.hostname || opts.host,
		},
		opts.headers
	);

	// `http(s).request()` does not understand pathname, query and
	// search.
	if (!opts.path) {
		var path = opts.pathname || '/';
		var query;

		if (opts.search) {
			path += opts.search;
		} else if ((query = opts.query)) {
			if (!isString(query)) {
				query = formatQueryString(query);
			}

			path += '?' + query;
		}

		opts.path = path;
	}

	var matches;
	var isSecure = !!(
		opts.protocol &&
		(matches = opts.protocol.match(HTTP_RE)) &&
		matches[1]
	);
	delete opts.protocol;

	debug('proxying %s http%s://%s%s',
		opts.method,
		isSecure ? 's' : '',
		opts.hostname,
		opts.path
	);

	var request = isSecure ? httpsRequest : httpRequest;

	var downReq = request(opts, function onResponse(downRes) {
		forEach(downRes.headers, function forwardResponseHeaderUp(value, name) {
			upRes.setHeader(name, value);
		});

		downRes.pipe(upRes);

		downRes.on('error', function forwardResponseErrorUp(error) {
			upRes.emit('error', error);
		});
	});
	upReq.pipe(downReq);

	downReq.on('error', function forwardRequestErrorUp(error) {
		upReq.emit('error', error);
	});

	upReq.on('close', function forwardRequestAbortionDown() {
		downReq.abort();
	});
}

module.exports = proxyRequest;
