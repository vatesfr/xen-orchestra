// Copied from packages/xo-server/src/utils.mjs — only the 5 helpers
// xapi-object-to-xo actually uses.
//
// The original module cannot be imported as-is: it pulls `tmp`, `crypto`,
// `path` and `highland` at module level, none of which survive a browser
// bundle. The helpers themselves are pure.

import forEach from 'lodash/forEach.js'
import isEmpty from 'lodash/isEmpty.js'
import { XMLParser } from 'fast-xml-parser'

// `export { default as forEach } from ...` would re-export without creating a
// local binding, and `mapFilter` below needs one.
export { forEach, isEmpty }

// Returns the value of a property and removes it from the object.
export function extractProperty(obj, prop) {
  const value = obj[prop]
  delete obj[prop]
  return value
}

export const mapFilter = (collection, iteratee) => {
  const result = []
  forEach(collection, (...args) => {
    const value = iteratee(...args)
    if (value) {
      result.push(value)
    }
  })
  return result
}

export const parseXml = (function () {
  const parser = new XMLParser({
    attributeNamePrefix: '',
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseTagValue: false,
    parseAttributeValue: false,
  })

  return xml => {
    try {
      // POC DIVERGENCE: the original is `Buffer.isBuffer(xml) ? xml.toString() : xml`.
      // `Buffer` is a bare global reference and throws ReferenceError in a browser.
      return parser.parse(typeof xml === 'string' ? xml : String(xml))
    } catch (error) {
      console.warn('parseXml', { error, xml })
      return ''
    }
  }
})()
