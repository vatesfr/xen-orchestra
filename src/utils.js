import base64url from 'base64url';
import forEach from 'lodash.foreach';
import has from 'lodash.has';
import multiKeyHash from 'multikey-hash';
import {promisify, method} from 'bluebird';
import {randomBytes} from 'crypto';

randomBytes = promisify(randomBytes);

//====================================================================

// Generate a secure random Base64 string.
let generateToken = (n = 32) => randomBytes(n).then(base64url);
export {generateToken};

// Special value which can be returned to stop an iteration in map()
// and mapInPlace().
let done = {};
export {done};

// Similar to `lodash.map()` for array and `lodash.mapValues()` for
// objects.
//
// Note: can  be interrupted by returning the special value `done`
// provided as the forth argument.
function map(col, iterator, thisArg = this) {
	let result = has(col, 'length') ? [] : {};
	forEach(col, (item, i) => {
		let value = iterator.call(thisArg, item, i, done);
		if (value === done) {
			return false;
		}

		result[i] = value;
	});
	return result;
}
export {map};

// Create a hash from multiple values.
export var multiKeyHash = (function (multiKeyHash) {
  return method((...args) => {
    let hash = multiKeyHash(...args);

    let buf = new Buffer(4);
    buf.writeUInt32LE(hash, 0);

    return base64url(buf);
  });
})(multiKeyHash);

// Similar to `map()` but change the current collection.
//
// Note: can  be interrupted by returning the special value `done`
// provided as the forth argument.
function mapInPlace(col, iterator, thisArg = this) {
	forEach(col, (item, i) => {
		let value = iterator.call(thisArg, item, i, done);
		if (value === done) {
			return false;
		}

		col[i] = value;
	});

	return col;
}
export {mapInPlace};

// Wrap a value in a function.
let wrap = (value) => () => value;
export {wrap};
