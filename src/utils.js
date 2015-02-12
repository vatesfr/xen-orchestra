import base64url from 'base64url';
import forEach from 'lodash.foreach';
import has from 'lodash.has';
import {promisify} from 'bluebird';
import {randomBytes} from 'crypto';

randomBytes = promisify(randomBytes);

//====================================================================

// Generate a secure random Base64 string.
let generateToken = (n = 32) => randomBytes(n).then(base64url);
exports.generateToken = generateToken;

// Special value which can be returned to stop an iteration in map()
// and mapInPlace().
let done = {};
exports.done = done;

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
exports.map = map;

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
exports.mapInPlace = mapInPlace;

// Wrap a value in a function.
let wrap = (value) => () => value;
exports.wrap = wrap;
