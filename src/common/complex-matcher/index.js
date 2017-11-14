import every from 'lodash/every'
import filter from 'lodash/filter'
import forEach from 'lodash/forEach'
import isArray from 'lodash/isArray'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import map from 'lodash/map'
import some from 'lodash/some'

import filterReduce from '../filter-reduce'
import invoke from '../invoke'

// ===================================================================

const RAW_STRING_CHARS = invoke(() => {
  const chars = { __proto__: null }
  const add = (a, b = a) => {
    let i = a.charCodeAt(0)
    const j = b.charCodeAt(0)
    while (i <= j) {
      chars[String.fromCharCode(i++)] = true
    }
  }
  add('$')
  add('-')
  add('.')
  add('0', '9')
  add('_')
  add('A', 'Z')
  add('a', 'z')
  return chars
})
const isRawString = string => {
  const { length } = string
  for (let i = 0; i < length; ++i) {
    if (!RAW_STRING_CHARS[string[i]]) {
      return false
    }
  }
  return true
}

// -------------------------------------------------------------------

export const createAnd = children =>
  children.length === 1 ? children[0] : { type: 'and', children }

export const createOr = children =>
  children.length === 1 ? children[0] : { type: 'or', children }

export const createNot = child => ({ type: 'not', child })

export const createProperty = (name, child) => ({
  type: 'property',
  name,
  child,
})

export const createString = value => ({ type: 'string', value })

export const createTruthyProperty = name => ({ type: 'truthyProperty', name })

// -------------------------------------------------------------------

// *and           = terms
// terms          = term+
// term           = ws (groupedAnd | or | not | property | truthyProperty | string) ws
// ws             = ' '*
// groupedAnd     = "(" and ")"
// *or            = "|" ws "(" terms ")"
// *not           = "!" term
// *property      = string ws ":" term
// *truthyProperty = string ws "?"
// *string        = quotedString | rawString
// quotedString   = "\"" ( /[^"\]/ | "\\\\" | "\\\"" )+
// rawString      = /[a-z0-9-_.]+/i
export const parse = invoke(() => {
  let i
  let n
  let input

  // -----

  const backtrace = parser => () => {
    const pos = i
    const node = parser()
    if (node != null) {
      return node
    }
    i = pos
  }

  // -----

  const parseAnd = () => parseTerms(createAnd)
  const parseTerms = fn => {
    let term = parseTerm()
    if (!term) {
      return
    }

    const terms = [term]
    while ((term = parseTerm())) {
      terms.push(term)
    }
    return fn(terms)
  }
  const parseTerm = () => {
    parseWs()

    const child =
      parseGroupedAnd() ||
      parseOr() ||
      parseNot() ||
      parseProperty() ||
      parseTruthyProperty() ||
      parseString()
    if (child) {
      parseWs()
      return child
    }
  }
  const parseWs = () => {
    while (input[i] === ' ') {
      ++i
    }

    return true
  }
  const parseGroupedAnd = backtrace(() => {
    let and
    if (input[i++] === '(' && (and = parseAnd()) && input[i++] === ')') {
      return and
    }
  })
  const parseOr = backtrace(() => {
    let or
    if (
      input[i++] === '|' &&
      parseWs() &&
      input[i++] === '(' &&
      (or = parseTerms(createOr)) &&
      input[i++] === ')'
    ) {
      return or
    }
  })
  const parseNot = backtrace(() => {
    let child
    if (input[i++] === '!' && (child = parseTerm())) {
      return createNot(child)
    }
  })
  const parseProperty = backtrace(() => {
    let name, child
    if (
      (name = parseString()) &&
      parseWs() &&
      input[i++] === ':' &&
      (child = parseTerm())
    ) {
      return createProperty(name.value, child)
    }
  })
  const parseString = () => {
    let value
    if (
      (value = parseQuotedString()) != null ||
      (value = parseRawString()) != null
    ) {
      return createString(value)
    }
  }
  const parseQuotedString = backtrace(() => {
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
  const parseRawString = () => {
    let value = ''
    let c
    while ((c = input[i]) && RAW_STRING_CHARS[c]) {
      ++i
      value += c
    }
    if (value.length) {
      return value
    }
  }
  const parseTruthyProperty = backtrace(() => {
    let name
    if ((name = parseString()) && parseWs() && input[i++] === '?') {
      return createTruthyProperty(name.value)
    }
  })

  return input_ => {
    if (!input_) {
      return
    }

    i = 0
    input = input_.split('')
    n = input.length

    try {
      return parseAnd()
    } finally {
      input = null
    }
  }
})

// -------------------------------------------------------------------

const _getPropertyClauseStrings = ({ child }) => {
  const { type } = child

  if (type === 'or') {
    const strings = []
    forEach(child.children, child => {
      if (child.type === 'string') {
        strings.push(child.value)
      }
    })
    return strings
  }

  if (type === 'string') {
    return [child.value]
  }

  return []
}

// Find possible values for property clauses in a and clause.
export const getPropertyClausesStrings = function () {
  if (!this) {
    return {}
  }

  const { type } = this

  if (type === 'property') {
    return {
      [this.name]: _getPropertyClauseStrings(this),
    }
  }

  if (type === 'and') {
    const strings = {}
    forEach(this.children, node => {
      if (node.type === 'property') {
        const { name } = node
        const values = strings[name]
        if (values) {
          values.push.apply(values, _getPropertyClauseStrings(node))
        } else {
          strings[name] = _getPropertyClauseStrings(node)
        }
      }
    })
    return strings
  }

  return {}
}

// -------------------------------------------------------------------

export const removePropertyClause = function (name) {
  let type
  if (!this || ((type = this.type) === 'property' && this.name === name)) {
    return
  }

  if (type === 'and') {
    return createAnd(
      filter(
        this.children,
        node => node.type !== 'property' || node.name !== name
      )
    )
  }

  return this
}

// -------------------------------------------------------------------

const _addAndClause = (node, child, predicate, reducer) =>
  createAnd(
    filterReduce(
      node.type === 'and' ? node.children : [node],
      predicate,
      reducer,
      child
    )
  )

export const setPropertyClause = function (name, child) {
  const property = createProperty(
    name,
    isString(child) ? createString(child) : child
  )

  if (!this) {
    return property
  }

  return _addAndClause(
    this,
    property,
    node => node.type === 'property' && node.name === name
  )
}

// -------------------------------------------------------------------

export const execute = invoke(() => {
  const visitors = {
    and: ({ children }, value) =>
      every(children, child => child::execute(value)),
    not: ({ child }, value) => !child::execute(value),
    or: ({ children }, value) => some(children, child => child::execute(value)),
    property: ({ name, child }, value) =>
      value != null && child::execute(value[name]),
    truthyProperty: ({ name }, value) => !!value[name],
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

      return ({ value: pattern }, value) => match(pattern.toLowerCase(), value)
    }),
  }

  return function (value) {
    return visitors[this.type](this, value)
  }
})

// -------------------------------------------------------------------

export const toString = invoke(() => {
  const toStringTerms = terms => map(terms, toString).join(' ')
  const toStringGroup = terms => `(${toStringTerms(terms)})`

  const visitors = {
    and: ({ children }) => toStringGroup(children),
    not: ({ child }) => `!${toString(child)}`,
    or: ({ children }) => `|${toStringGroup(children)}`,
    property: ({ name, child }) =>
      `${toString(createString(name))}:${toString(child)}`,
    string: ({ value }) =>
      isRawString(value)
        ? value
        : `"${value.replace(/\\|"/g, match => `\\${match}`)}"`,
    truthyProperty: ({ name }) => `${toString(createString(name))}?`,
  }

  const toString = node => visitors[node.type](node)

  // Special case for a root “and”: do not add braces.
  return function () {
    return !this
      ? ''
      : this.type === 'and' ? toStringTerms(this.children) : toString(this)
  }
})

// -------------------------------------------------------------------

export const create = pattern => {
  pattern = parse(pattern)
  if (!pattern) {
    return
  }

  return value => pattern::execute(value)
}
