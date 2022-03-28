'use strict'

const compareNumbers = (a, b) => a - b

const createParser = ({ fields: [...fields], presets: { ...presets } }) => {
  const m = fields.length

  for (let j = 0; j < m; ++j) {
    const field = fields[j]
    let { aliases } = field
    if (aliases !== undefined) {
      let symbols = aliases

      if (Array.isArray(aliases)) {
        aliases = {}
        const [start] = field.range
        symbols.forEach((alias, i) => {
          aliases[alias] = start + i
        })
      } else {
        symbols = Object.keys(aliases)
      }

      fields[j] = {
        ...field,
        aliases,
        aliasesRegExp: new RegExp(symbols.join('|'), 'y'),
      }
    }
  }

  let field, i, n, pattern, schedule, values

  const isDigit = c => c >= '0' && c <= '9'
  const match = c => pattern[i] === c && (++i, true)

  const consumeWhitespaces = () => {
    let c
    while ((c = pattern[i]) === ' ' || c === '\t') {
      ++i
    }
  }

  const parseInteger = () => {
    let c
    const digits = []
    while (isDigit((c = pattern[i]))) {
      ++i
      digits.push(c)
    }
    if (digits.length === 0) {
      throw new SyntaxError(`${field.name}: missing integer at character ${i}`)
    }
    return Number.parseInt(digits.join(''), 10)
  }

  const parseValue = () => {
    let value

    const { aliasesRegExp } = field
    if (aliasesRegExp === undefined || isDigit(pattern[i])) {
      value = parseInteger()
      const { post } = field
      if (post !== undefined) {
        value = post(value)
      }
    } else {
      aliasesRegExp.lastIndex = i
      const matches = aliasesRegExp.exec(pattern)
      if (matches === null) {
        throw new SyntaxError(`${field.name}: missing alias or integer at character ${i}`)
      }
      const [alias] = matches
      i += alias.length
      value = field.aliases[alias]
    }

    const { range } = field
    if (value < range[0] || value > range[1]) {
      throw new SyntaxError(`${field.name}: ${value} is not between ${range[0]} and ${range[1]}`)
    }
    return value
  }

  const parseRange = () => {
    let end, start, step
    if (match('*')) {
      if (!match('/')) {
        return
      }
      ;[start, end] = field.range
      step = parseInteger()
    } else {
      start = parseValue()
      if (!match('-')) {
        values.add(start)
        return
      }
      end = parseValue()
      step = match('/') ? parseInteger() : 1
    }

    for (let i = start; i <= end; i += step) {
      values.add(i)
    }
  }

  const parseSequence = () => {
    do {
      parseRange()
    } while (match(','))
  }

  const parse = p => {
    {
      const schedule = presets[p]
      if (schedule !== undefined) {
        return typeof schedule === 'string' ? (presets[p] = parse(schedule)) : schedule
      }
    }

    try {
      i = 0
      n = p.length
      pattern = p
      schedule = {}

      for (let j = 0; j < m; ++j) {
        consumeWhitespaces()

        field = fields[j]
        values = new Set()
        parseSequence()
        if (values.size !== 0) {
          schedule[field.name] = Array.from(values).sort(compareNumbers)
        }
      }

      consumeWhitespaces()
      if (i !== n) {
        throw new SyntaxError(`unexpected character at offset ${i}, expected end`)
      }

      return schedule
    } finally {
      field = pattern = schedule = values = undefined
    }
  }

  return parse
}

module.exports = createParser({
  fields: [
    {
      name: 'minute',
      range: [0, 59],
    },
    {
      name: 'hour',
      range: [0, 23],
    },
    {
      name: 'dayOfMonth',
      range: [1, 31],
    },
    {
      aliases: 'jan feb mar apr may jun jul aug sep oct nov dec'.split(' '),
      name: 'month',
      range: [0, 11],
    },
    {
      aliases: 'sun mon tue wen thu fri sat'.split(' '),
      name: 'dayOfWeek',
      post: value => (value === 7 ? 0 : value),
      range: [0, 6],
    },
  ],
  presets: {
    '@annually': '0 0 1 jan *',
    '@daily': '0 0 * * *',
    '@hourly': '0 * * * *',
    '@monthly': '0 0 1 * *',
    '@weekly': '0 0 * * sun',
    '@yearly': '0 0 1 jan *',
  },
})
