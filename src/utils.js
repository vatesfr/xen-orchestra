import base64url from 'base64url';
import forEach from 'lodash.foreach';
import has from 'lodash.has';
import humanFormat from 'human-format';
import isArray from 'lodash.isarray';
import multiKeyHash from 'multikey-hash';
import xml2js from 'xml2js';
import {promisify, method} from 'bluebird';
import {randomBytes} from 'crypto';

randomBytes = promisify(randomBytes);

//====================================================================

// Ensure the value is an array, wrap it if necessary.
let ensureArray = (value) => {
  if (value === undefined) {
    return [];
  }

  return isArray(value) ? value : [value];
};
export {ensureArray};

//--------------------------------------------------------------------

// Generate a secure random Base64 string.
let generateToken = (n = 32) => randomBytes(n).then(base64url);
export {generateToken};

//--------------------------------------------------------------------

let formatXml;
{
	let builder = new xml2js.Builder({
		xmldec: {
      // Do not include an XML header.
      //
      // This is not how this setting should be set but due to the
      // implementation of both xml2js and xmlbuilder-js it works.
      //
      // TODO: Find a better alternative.
      headless: true
		}
	});

	formatXml = (...args) => builder.buildObject(...args);
}
export {formatXml};

let parseXml;
{
	let opts = {
		mergeAttrs: true,
		explicitArray: false,
	};

	parseXml = (xml) => {
		let result;

		// xml2js.parseString() use a callback for synchronous code.
		xml2js.parseString(xml, opts, (error, result_) => {
			if (error) {
				throw error;
			}

			result = result_;
		});

		return result;
	};
}
export {parseXml};

//--------------------------------------------------------------------

function parseSize(size) {
  let bytes = humanFormat.parse.raw(size, { scale: 'binary' });
  if (bytes.unit && bytes.unit !== 'B') {
    bytes = humanFormat.parse.raw(size);

    if (bytes.unit && bytes.unit !== 'B') {
      throw new Error('invalid size: ' + size);
    }
  }
  return Math.floor(bytes.value * bytes.factor);
}

export {parseSize};

//--------------------------------------------------------------------

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
multiKeyHash = (function (multiKeyHash) {
  return method((...args) => {
    let hash = multiKeyHash(...args);

    let buf = new Buffer(4);
    buf.writeUInt32LE(hash, 0);

    return base64url(buf);
  });
})(multiKeyHash);
export {multiKeyHash};

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
