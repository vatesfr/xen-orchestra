import { isPlainObject, some } from 'lodash'

// ===================================================================

// Invoke a function and returns it result.
// All parameters are forwarded.
//
// Why using `invoke()`?
// - avoid tedious IIFE syntax
// - avoid declaring variables in the common scope
// - monkey-patching
//
// ```js
// const sum = invoke(1, 2, (a, b) => a + b)
//
// eventEmitter.emit = invoke(eventEmitter.emit, emit => function (event) {
//   if (event === 'foo') {
//     throw new Error('event foo is disabled')
//   }
//
//   return emit.apply(this, arguments)
// })
// ```
function invoke (fn) {
  const n = arguments.length - 1
  if (!n) {
    return fn()
  }

  fn = arguments[n]
  const args = new Array(n)
  for (let i = 0; i < n; ++i) {
    args[i] = arguments[i]
  }

  return fn.apply(undefined, args)
}

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
    if (!(string[i] in RAW_STRING_CHARS)) {
      return false
    }
  }
  return true
}

// -------------------------------------------------------------------

class Node {
  createPredicate () {
    return value => this.match(value)
  }
}

export class Null extends Node {
  match () {
    return true
  }

  toString () {
    return ''
  }
}

const formatTerms = terms => terms.map(term => term.toString(true)).join(' ')

export class And extends Node {
  constructor (children) {
    super()

    if (children.length === 1) {
      return children[0]
    }
    this.children = children
  }

  match (value) {
    return this.children.every(child => child.match(value))
  }

  toString (isNested) {
    const terms = formatTerms(this.children)
    return isNested ? `(${terms})` : terms
  }
}

export class Or extends Node {
  constructor (children) {
    super()

    if (children.length === 1) {
      return children[0]
    }
    this.children = children
  }

  match (value) {
    return this.children.some(child => child.match(value))
  }

  toString () {
    return `|(${formatTerms(this.children)})`
  }
}

export class Not extends Node {
  constructor (child) {
    super()

    this.child = child
  }

  match (value) {
    return !this.child.match(value)
  }

  toString () {
    return '!' + this.child.toString(true)
  }
}

export class NumberNode extends Node {
  constructor (value) {
    super()

    this.value = value

    // should not be enumerable for the tests
    Object.defineProperty(this, 'match', {
      value: this.match.bind(this),
    })
  }

  match (value) {
    return (
      value === this.value ||
      (value !== null && typeof value === 'object' && some(value, this.match))
    )
  }

  toString () {
    return String(this.value)
  }
}
export { NumberNode as Number }

export class Property extends Node {
  constructor (name, child) {
    super()

    this.name = name
    this.child = child
  }

  match (value) {
    return value != null && this.child.match(value[this.name])
  }

  toString () {
    return `${formatString(this.name)}:${this.child.toString(true)}`
  }
}

const escapeChar = char => '\\' + char
const formatString = value =>
  Number.isNaN(+value)
    ? isRawString(value) ? value : `"${value.replace(/\\|"/g, escapeChar)}"`
    : `"${value}"`

export class StringNode extends Node {
  constructor (value) {
    super()

    this.lcValue = value.toLowerCase()
    this.value = value

    // should not be enumerable for the tests
    Object.defineProperty(this, 'match', {
      value: this.match.bind(this),
    })
  }

  match (value) {
    if (typeof value === 'string') {
      return value.toLowerCase().indexOf(this.lcValue) !== -1
    }

    if (Array.isArray(value) || isPlainObject(value)) {
      return some(value, this.match)
    }

    return false
  }

  toString () {
    return formatString(this.value)
  }
}
export { StringNode as String }

export class TruthyProperty extends Node {
  constructor (name) {
    super()

    this.name = name
  }

  match (value) {
    return value != null && !!value[this.name]
  }

  toString () {
    return formatString(this.name) + '?'
  }
}

// -------------------------------------------------------------------

// terms          = null || term+
// *null          = /$/
// term           = ws (and | or | not | property | truthyProperty | numberOrString) ws
// ws             = ' '*
// *and           = "(" terms ")"
// *or            = "|" ws "(" terms ")"
// *not           = "!" term
// *property      = string ws ":" term
// *truthyProperty = string ws "?"
// numberOrString = string
// string         = quotedString | rawString
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
    if (node !== undefined) {
      return node
    }
    i = pos
  }

  // -----

  const parseTerms = Node => {
    let term = parseTerm()
    if (!term) {
      return new Null()
    }

    const terms = [term]
    while ((term = parseTerm())) {
      terms.push(term)
    }
    return new Node(terms)
  }
  const parseTerm = () => {
    parseWs()

    const child =
      parseAnd() ||
      parseOr() ||
      parseNot() ||
      parseProperty() ||
      parseTruthyProperty() ||
      parseNumberOrString()
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
  const parseAnd = backtrace(() => {
    let and
    if (input[i++] === '(' && (and = parseTerm(And)) && input[i++] === ')') {
      return and
    }
  })
  const parseOr = backtrace(() => {
    let or
    if (
      input[i++] === '|' &&
      parseWs() &&
      input[i++] === '(' &&
      (or = parseTerms(Or)) &&
      input[i++] === ')'
    ) {
      return or
    }
  })
  const parseNot = backtrace(() => {
    let child
    if (input[i++] === '!' && (child = parseTerm())) {
      return new Not(child)
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
      return new Property(name, child)
    }
  })
  const parseNumberOrString = () => {
    let str = parseQuotedString()
    if (str !== undefined) {
      return new StringNode(str)
    }
    str = parseRawString()
    if (str !== undefined) {
      const asNum = +str
      return Number.isNaN(asNum) ? new StringNode(str) : new NumberNode(asNum)
    }
  }
  const parseString = () => {
    let value
    if (
      (value = parseQuotedString()) !== undefined ||
      (value = parseRawString()) !== undefined
    ) {
      return value
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
      return new TruthyProperty(name)
    }
  })

  return input_ => {
    i = 0
    input = input_.split('')
    n = input.length

    try {
      return parseTerms(And)
    } finally {
      input = undefined
    }
  }
})

// -------------------------------------------------------------------

const _getPropertyClauseStrings = ({ child }) => {
  if (child instanceof Or) {
    const strings = []
    child.children.forEach(child => {
      if (child instanceof StringNode) {
        strings.push(child.value)
      }
    })
    return strings
  }

  if (child instanceof StringNode) {
    return [child.value]
  }

  return []
}

// Find possible values for property clauses in a and clause.
export const getPropertyClausesStrings = node => {
  if (!node) {
    return {}
  }

  if (node instanceof Property) {
    return {
      [node.name]: _getPropertyClauseStrings(node),
    }
  }

  if (node instanceof And) {
    const strings = {}
    node.children.forEach(node => {
      if (node instanceof Property) {
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

export const setPropertyClause = (node, name, child) => {
  const property = child && new Property(
    name,
    typeof child === 'string' ? new StringNode(child) : child
  )

  if (node === undefined) {
    return property
  }

  const children = (node instanceof And ? node.children : [node]).filter(child =>
    !(child instanceof Property && child.name === name)
  )
  if (property !== undefined) {
    children.push(property)
  }
  return new And(children)
}
