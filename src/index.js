import debug from 'debug';
debug = debug('xo:main');

import Bluebird from 'bluebird';
Bluebird.longStackTraces();

import appConf from 'app-conf';
import assign from 'lodash.assign';
import bind from 'lodash.bind';
import createConnectApp from 'connect';
import eventToPromise from 'event-to-promise';
import forEach from 'lodash.foreach';
import has from 'lodash.has';
import isArray from 'lodash.isarray';
import pick from 'lodash.pick';
import serveStatic from 'serve-static';
import WebSocket from 'ws';
import {
	AlreadyAuthenticated,
	InvalidCredential,
	InvalidParameters,
	NoSuchObject,
	NotImplementd,
} from './api-errors';
import {coroutine} from 'bluebird';
import {createServer as createJsonRpcServer} from 'json-rpc';
import {readFile} from 'fs-promise';

import Api from './api';
import WebServer from 'http-server-plus';
import wsProxy from './ws-proxy';
import XO from './xo';

//====================================================================

let info = (...args) => {
	console.info('[Info]', ...args);
};

let warn = (...args) => {
	console.warn('[Warn]', ...args);
};

//====================================================================

const DEFAULTS = {
	http: {
		listen: [
			{ port: 80 },
		],
		mounts: {},
	},
};

const DEPRECATED_ENTRIES = [
	'users',
	'servers',
];

let loadConfiguration = coroutine(function *() {
	let config = yield appConf.load('xo-server', {
		defaults: DEFAULTS,
		ignoreUnknownFormats: true,
	});

	debug('Configuration loaded.');

	// Print a message if deprecated entries are specified.
	forEach(DEPRECATED_ENTRIES, entry => {
		if (has(config, entry)) {
			warn(`${entry} configuration is deprecated.`);
		}
	});

	return config;
});

//====================================================================

let makeWebServerListen = coroutine(function *(opts) {
	// Read certificate and key if necessary.
	let {certificate, key} = opts;
	if (certificate && key) {
		[opts.certificate, opts.key] = yield Bluebird.all([
			readFile(certificate),
			readFile(key),
		]);
	}

	try {
		let niceAddress = yield this.listen(opts);
		debug(`Web server listening on ${niceAddress}`);
	} catch (error) {
		warn(`Web server could not listen on ${error.niceAddress}`);

		let {code} = error;
		if (code === 'EACCES') {
			warn('  Access denied.');
			warn('  Ports < 1024 are often reserved to privileges users.');
		} else if (code === 'EADDRINUSE') {
			warn('  Address already in use.');
		}
	}
});

let createWebServer = opts => {
	let webServer = new WebServer();

	return Bluebird
		.bind(webServer).return(opts).map(makeWebServerListen)
		.return(webServer)
	;
};

//====================================================================

let setUpStaticFiles = (connect, opts) => {
	forEach(opts, (paths, url) => {
		if (!isArray(paths)) {
			paths = [paths];
		}

		forEach(paths, path => {
			debug('Setting up %s → %s', url, path);

			connect.use(url, serveStatic(path));
		});
	});
};

//====================================================================

let errorClasses = {
	ALREADY_AUTHENTICATED: AlreadyAuthenticated,
	INVALID_CREDENTIAL: InvalidCredential,
	INVALID_PARAMS: InvalidParameters,
	NO_SUCH_OBJECT: NoSuchObject,
	NOT_IMPLEMENTED: NotImplementd,
};

let apiHelpers = {
	getUserPublicProperties(user) {
		// Handles both properties and wrapped models.
		let properties = user.properties || user;

		return pick(properties, 'id', 'email', 'permission');
	},

	getServerPublicProperties(server) {
		// Handles both properties and wrapped models.
		let properties = server.properties || server;

		return pick(properties, 'id', 'host', 'username');
	},

	throw(errorId, data) {
		throw new (errorClasses[errorId])(data);
	}
};

let setUpApi = (webServer, xo) => {
	let context = Object.create(xo);
	assign(xo, apiHelpers);

	let api = new Api({
		context,
	});

	let webSocketServer = new WebSocket.Server({
		server: webServer,
		path: '/api/',
	});

	webSocketServer.on('connection', connection => {
		debug('+ WebSocket connection');

		let xoConnection;

		// Create the JSON-RPC server for this connection.
		let jsonRpc = createJsonRpcServer(message => {
			if (message.type === 'request') {
				return api.call(xoConnection, message.method, message.params);
			}
		});

		// Create the abstract XO object for this connection.
		xoConnection = xo.createUserConnection({
			close: bind(connection.close, connection),
			notify: bind(jsonRpc.notify, jsonRpc),
		});

		// Close the XO connection with this WebSocket.
		connection.once('close', () => {
			debug('- WebSocket connection');

			xoConnection.close();
		});

		// Connect the WebSocket to the JSON-RPC server.
		connection.on('message', message => {
			jsonRpc.write(message);
		});

		let onSend = error => {
			if (error) {
				warn('WebSocket send:', error.stack);
			}
		};
		jsonRpc.on('data', data => {
			connection.send(JSON.stringify(data), onSend);
		});
	});
};

//====================================================================

let getVmConsoleUrl = (xo, id) => {
	let vm = xo.getObject(id, ['VM', 'VM-controller']);
	if (!vm || vm.power_state !== 'Running') {
		return;
	}

	let {sessionId} = xo.getXAPI(vm);

	let url;
	forEach(vm.consoles, console => {
		if (console.protocol === 'rfb') {
			url = `${console.location}&session_id=${sessionId}`;
			return false;
		}
	});

	return url;
};

const CONSOLE_PROXY_PATH_RE = /^\/consoles\/(.*)$/;

let setUpConsoleProxy = (webServer, xo) => {
	let webSocketServer = new WebSocket.Server({
		noServer: true,
	});

	webServer.on('upgrade', (req, res, head) => {
		let matches = CONSOLE_PROXY_PATH_RE.exec(req.url);
		if (!matches) {
			return;
		}

		let url = getVmConsoleUrl(xo, matches[1]);
		if (!url) {
			return;
		}

		webSocketServer.handleUpgrade(req, res, head, connection => {
			wsProxy(connection, url);
		});
	});
};

//====================================================================

let help;
{
	let {name, version} = require('../package');
	help = () => `${name} v${version}`;
}

//====================================================================

let main = coroutine(function *(args) {
	if (args.indexOf('--help') !== -1 || args.indexOf('-h') !== -1) {
		return help();
	}

	let config = yield loadConfiguration();

	let webServer = yield createWebServer(config.http.listen);

	// Now the web server is listening, drop privileges.
	try {
		let {user, group} = config;
		if (group) {
			process.setgid(group);
			debug('Group changed to', group);
		}
		if (user) {
			process.setuid(user);
			debug('User changed to', user);
		}
	} catch (error) {
		warn('Failed to change user/group:', error);
	}

	// Create the main object which will connects to Xen servers and
	// manages all the models.
	let xo = new XO();
	xo.start({
		redis: {
			uri: config.redis && config.redis.uri,
		},
	});

	// Connect is used to manage non WebSocket connections.
	let connect = createConnectApp();
	webServer.on('request', connect);

	// Must be set up before the API.
	setUpConsoleProxy(webServer, xo);

	// Must be set up before the API.
	connect.use(bind(xo.handleProxyRequest, xo));

	// Must be set up before the static files.
	setUpApi(webServer, xo);

	setUpStaticFiles(connect, config.http.mounts);

	if (!yield xo.users.exists()) {
		let email = 'admin@admin.net';
		let password = 'admin';

		xo.users.create(email, password, 'admin');
		info('Default user created:', email, ' with password', password);
	}

	return eventToPromise(webServer, 'close');
});

exports = module.exports = main;
