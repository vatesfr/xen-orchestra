import { parseXml } from '@vates/xml/parse'

// inverse of _toOvaXml.mjs: parse the XML-RPC like content of ova.xml
//
// untyped values (strings, integers, refs) are kept as strings, like the records returned by xapi over JSON-RPC

const isElement = node => typeof node !== 'string'

function textOf(node) {
  return node.children.filter(child => !isElement(child)).join('')
}

function assertName(node, expected) {
  if (node === undefined || node.name !== expected) {
    throw new Error(`invalid ova.xml: expected a <${expected}> element, got <${node?.name}>`)
  }
}

// xapi writes 20220101T00:00:00Z, newer versions may write 2022-01-01T00:00:00Z
function parseDate(text) {
  const match = /^(\d{4})-?(\d{2})-?(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z?$/.exec(text)
  if (match === null) {
    throw new Error(`invalid ova.xml: unsupported dateTime.iso8601 value ${text}`)
  }
  const [, year, month, day, hours, minutes, seconds] = match
  return new Date(Date.UTC(+year, +month - 1, +day, +hours, +minutes, +seconds))
}

function parseStruct(node) {
  const struct = {}
  for (const member of node.children.filter(isElement)) {
    assertName(member, 'member')
    const [name, value] = member.children.filter(isElement)
    assertName(name, 'name')
    struct[textOf(name)] = parseValue(value)
  }
  return struct
}

function parseArray(node) {
  const [data] = node.children.filter(isElement)
  assertName(data, 'data')
  return data.children.filter(isElement).map(parseValue)
}

function parseValue(node) {
  assertName(node, 'value')
  const elements = node.children.filter(isElement)
  if (elements.length === 0) {
    return textOf(node)
  }
  if (elements.length !== 1) {
    throw new Error('invalid ova.xml: a <value> must contain a single typed element')
  }
  const [typed] = elements
  switch (typed.name) {
    case 'struct':
      return parseStruct(typed)
    case 'array':
      return parseArray(typed)
    case 'boolean':
      return textOf(typed) === '1'
    case 'dateTime.iso8601':
      return parseDate(textOf(typed))
    case 'double':
      return Number(textOf(typed))
    case 'string':
    case 'int':
    case 'i4':
    case 'i8':
      return textOf(typed)
    default:
      throw new Error(`invalid ova.xml: unsupported value type <${typed.name}>`)
  }
}

/**
 * @param {string} xml content of ova.xml
 * @returns {{ version: object, objects: Array<{ class: string, id: string, snapshot: object }> }}
 */
export function parseOvaXml(xml) {
  // don't alter the text values: a name_description can contain new lines or spaces
  const root = parseXml(xml, { normalize: false, trim: false })
  const { version, objects } = parseValue(root)
  if (typeof version !== 'object' || !Array.isArray(objects)) {
    throw new Error('invalid ova.xml: version and objects are missing')
  }
  for (const object of objects) {
    if (typeof object.class !== 'string' || typeof object.id !== 'string' || typeof object.snapshot !== 'object') {
      throw new Error('invalid ova.xml: each object must have a class, an id and a snapshot')
    }
  }
  return { version, objects }
}
