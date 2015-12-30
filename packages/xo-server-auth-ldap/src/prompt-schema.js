import { prompt } from 'inquirer'

// ===================================================================

const forArray = (array, iteratee) => {
  for (let i = 0, n = array.length; i < n; ++i) {
    iteratee(array[i], i, array)
  }
}

const { hasOwnProperty } = Object.prototype
const forOwn = (object, iteratee) => {
  for (const key in object) {
    if (hasOwnProperty.call(object, key)) {
      iteratee(object[key], key, object)
    }
  }
}

// -------------------------------------------------------------------

const _makeAsyncIterator = iterator => (promises, cb) => {
  let mainPromise = Promise.resolve()

  iterator(promises, (promise, key) => {
    mainPromise = mainPromise

      // Waits the current promise.
      .then(() => promise)

      // Executes the callback.
      .then(value => cb(value, key))
  })

  return mainPromise
}

const forOwnAsync = _makeAsyncIterator(forOwn)

// -------------------------------------------------------------------

const _isNaN = (
  Number.isNaN ||
  (value => value !== value) // eslint-disable-line no-self-compare
)

const isNumber = value => !_isNaN(value) && typeof value === 'number'

const isInteger = (
  Number.isInteger ||
  (value => (
    isNumber(value) &&
    value > -Infinity && value < Infinity &&
    Math.floor(value) === value
  ))
)

// ===================================================================

const EMPTY_OBJECT = Object.freeze({ __proto__: null })

const _extractValue = ({ value }) => value

export const confirm = (message, {
  default: defaultValue = null
} = EMPTY_OBJECT) => new Promise(resolve => prompt({
  default: defaultValue,
  message,
  name: 'value',
  type: 'confirm'
}, resolve)).then(_extractValue)

export const input = (message, {
  default: defaultValue = null,
  filter = undefined,
  validate = undefined
} = EMPTY_OBJECT) => new Promise(resolve => prompt({
  default: defaultValue,
  message,
  name: 'value',
  type: 'input',
  validate
}, resolve)).then(_extractValue)

export const list = (message, choices, {
  default: defaultValue = null
} = EMPTY_OBJECT) => new Promise(resolve => prompt({
  default: defaultValue,
  choices,
  message,
  name: 'value',
  type: 'list'
}, resolve)).then(_extractValue)

export const password = (message, {
  default: defaultValue = null,
  filter = undefined,
  validate = undefined
} = EMPTY_OBJECT) => new Promise(resolve => prompt({
  default: defaultValue,
  message,
  name: 'value',
  type: 'password',
  validate
}, resolve)).then(_extractValue)

// ===================================================================

const promptByType = {
  __proto__: null,

  array: async (schema, defaultValue, path) => {
    const items = []
    if (defaultValue == null) {
      defaultValue = items
    }

    let i = 0

    const itemSchema = schema.items
    const promptItem = async () => {
      items[i] = await promptGeneric(
        itemSchema,
        defaultValue[i],
        path
          ? `${path} [${i}]`
          : `[${i}]`
      )

      ++i
    }

    let n = schema.minItems || 0
    while (i < n) {
      await promptItem()
    }

    n = schema.maxItems || Infinity
    while (
      i < n &&
      await confirm('additional item?', {
        default: false
      })
    ) {
      await promptItem()
    }

    return items
  },

  boolean: (schema, defaultValue, path) => confirm(path, {
    default: defaultValue || schema.default
  }),

  enum: (schema, defaultValue, path) => list(path, schema.enum, {
    defaultValue: defaultValue || schema.defaultValue
  }),

  integer: (schema, defaultValue, path) => input(path, {
    default: defaultValue || schema.default,
    filter: input => +input,
    validate: input => isInteger(+input)
  }),

  number: (schema, defaultValue, path) => input(path, {
    default: defaultValue || schema.default,
    filter: input => +input,
    validate: input => isNumber(+input)
  }),

  object: async (schema, defaultValue, path) => {
    const value = {}

    const required = {}
    schema.required && forArray(schema.required, name => {
      required[name] = true
    })

    const promptProperty = async (schema, name) => {
      const subpath = path
        ? `${path} > ${schema.title || name}`
        : schema.title || name

      if (
        required[name] ||
        await confirm(`fill optional ${subpath}?`, {
          default: false
        })
      ) {
        value[name] = await promptGeneric(
          schema,
          defaultValue && defaultValue[name],
          subpath
        )
      }
    }

    await forOwnAsync(schema.properties || {}, promptProperty)

    return value
  },

  string: (schema, defaultValue, path) => input(path, {
    default: defaultValue || schema.default
  })
}

export default function promptGeneric (schema, defaultValue, path) {
  const type = schema.enum
    ? 'enum'
    : schema.type

  const prompt = promptByType[type.toLowerCase()]
  if (!prompt) {
    throw new Error(`unsupported type: ${type}`)
  }

  return prompt(schema, defaultValue, path)
}

