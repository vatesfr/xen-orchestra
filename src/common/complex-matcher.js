import every from 'lodash/every'
import isArray from 'lodash/isArray'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import map from 'lodash/map'
import some from 'lodash/some'

import invoke from './invoke'

const RAW_STRING_RE = /^[a-z0-9-_.]+/i


// -------------------------------------------------------------------

export const createAnd = children => children.length === 1
  ? children[0]
  : ({ type: 'and', children })

export const createOr = children => children.length === 1
  ? children[0]
  : ({ type: 'or', children })

export const createNot = child => ({ type: 'not', child })

export const createProperty = (name, child) => ({ type: 'property', name, child })

export const createString = value => ({ type: 'string', value })

// -------------------------------------------------------------------

// term         = ws (and | or | not | property | string) ws
// ws           = ' '*
// *and         = group
// group        = "(" term+ ")"
// *or          = "|" ws group
// *not         = "!" term
// *property    = string ws ":" term
// *string      = quotedString | rawString
// quotedString = "\"" ( /[^"\]/ | "\\\\" | "\\\"" )+
// rawString    = /[a-z0-9-_.]+/i
export const parse = invoke(() => {
  let i
  let n
  let input

  // -----

  const rule = parser => () => {
    const pos = i
    const node = parser()
    if (node != null) {
      return node
    }
    i = pos
  }

  // -----

  const parseTerm = rule(() => {
    parseWs()

    const child = (
      parseAnd() ||
      parseOr() ||
      parseNot() ||
      parseProperty() ||
      parseString()
    )
    if (child) {
      parseWs()
      return child
    }
  })
  const parseWs = () => {
    while (i < n && input[i] === ' ') {
      ++i
    }

    return true
  }
  const parseAnd = rule(() => {
    const children = parseGroup()
    if (children) {
      return children.length === 1
        ? children[0]
        : { type: 'and', children }
    }
  })
  const parseGroup = rule(() => {
    if (input[i++] !== '(') {
      return
    }

    const terms = []
    while (i < n) { // eslint-disable-line no-unmodified-loop-condition
      const term = parseTerm()
      if (!term) {
        break
      }
      terms.push(term)
    }

    if (
      terms.length &&
      input[i++] === ')'
    ) {
      return terms
    }
  })
  const parseOr = rule(() => {
    let children
    if (
      input[i++] === '|' &&
      parseWs() &&
      (children = parseGroup())
    ) {
      return children.length === 1
        ? children[0]
        : { type: 'or', children }
    }
  })
  const parseNot = rule(() => {
    let child
    if (
      input[i++] === '!' &&
      (child = parseTerm())
    ) {
      return { type: 'not', child }
    }
  })
  const parseProperty = rule(() => {
    let name, child
    if (
      (name = parseString()) &&
      parseWs() &&
      (input[i++] === ':') &&
      (child = parseTerm())
    ) {
      return { type: 'property', name: name.value, child }
    }
  })
  const parseString = rule(() => {
    let value
    if (
      (value = parseQuotedString()) != null ||
      (value = parseRawString()) != null
    ) {
      return { type: 'string', value }
    }
  })
  const parseQuotedString = rule(() => {
    if (input[i++] !== '"') {
      return
    }

    const value = []
    let char
    while (i < n && (char = input[i++]) !== '"') {
      if (char === '\\') {
        char = input[i++]
      }
      value.push(char)
    }

    return value.join('')
  })
  const parseRawString = rule(() => {
    const matches = input.slice(i).match(RAW_STRING_RE)
    if (!matches) {
      return
    }

    const value = matches[0]
    i += value.length

    return value
  })

  return input_ => {
    i = 0
    input = `(${input_})` // There is an implicit “and”.
    n = input.length

    try {
      return parseTerm()
    } finally {
      input = null
    }
  }
})

export const execute = invoke(() => {
  const visitors = {
    and: ({ children }, value) => (
      every(children, child => execute(child, value))
    ),
    not: ({ child }, value) => (
      !execute(child, value)
    ),
    or: ({ children }, value) => (
      some(children, child => execute(child, value))
    ),
    property: ({ name, child }, value) => (
      value != null && execute(child, value[name])
    ),
    string: invoke(() => {
      const match = (pattern, value) => {
        if (isString(value)) {
          return value.toLowerCase().indexOf(pattern) !== -1
        }

        if (isArray(value) || isPlainObject(value)) {
          return some(value, value => match(pattern, value))
        }

        return false
      }

      return ({ value: pattern }, value) => (
        match(pattern.toLowerCase(), value)
      )
    })
  }

  return (node, value) => visitors[node.type](node, value)
})

export const toString = invoke(() => {
  const toStringTerms = terms => map(terms, toString).join(' ')
  const toStringGroup = terms => `(${toStringTerms(terms)})`

  const visitors = {
    and: ({ children }) => toStringGroup(children),
    not: ({ child }) => `!${toString(child)}`,
    or: ({ children }) => `|${toStringGroup(children)}`,
    property: ({ name, child }) => `${name}:${toString(child)}`,
    string: ({ value }) => {
      const matches = value.match(RAW_STRING_RE)

      return matches && matches[0].length === value.length
        ? value
        : `"${value.replace(/\\|"/g, match => `\\${match}`)}"`
    }
  }

  const toString = node => visitors[node.type](node)

  // Special case for a root “and”: do not add braces.
  return node => node.type === 'and'
    ? toStringTerms(node.children)
    : toString(node)
})

export const create = pattern => {
  pattern = parse(pattern)
  if (!pattern) {
    return
  }

  return value => execute(pattern, value)
}
