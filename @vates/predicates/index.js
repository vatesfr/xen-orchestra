'use strict'

const {
  isArray,
  prototype: { filter },
} = Array

class InvalidPredicate extends TypeError {
  constructor(value) {
    super('not a valid predicate')
    this.value = value
  }
}

function isDefinedPredicate(value) {
  if (value === undefined) {
    return false
  }

  if (typeof value !== 'function') {
    throw new InvalidPredicate(value)
  }

  return true
}

function handleArgs() {
  let predicates
  if (!(arguments.length === 1 && isArray((predicates = arguments[0])))) {
    predicates = arguments
  }
  return filter.call(predicates, isDefinedPredicate)
}

exports.every = function every() {
  const predicates = handleArgs.apply(this, arguments)
  const n = predicates.length
  if (n === 0) {
    return
  }
  if (n === 1) {
    return predicates[0]
  }
  return function everyPredicate() {
    for (let i = 0; i < n; ++i) {
      if (!predicates[i].apply(this, arguments)) {
        return false
      }
    }
    return true
  }
}

const notPredicateTag = {}
exports.not = function not(predicate) {
  if (isDefinedPredicate(predicate)) {
    if (predicate.tag === notPredicateTag) {
      return predicate.predicate
    }

    function notPredicate() {
      return !predicate.apply(this, arguments)
    }
    notPredicate.predicate = predicate
    notPredicate.tag = notPredicateTag
    return notPredicate
  }
}

exports.some = function some() {
  const predicates = handleArgs.apply(this, arguments)
  const n = predicates.length
  if (n === 0) {
    return
  }
  if (n === 1) {
    return predicates[0]
  }
  return function somePredicate() {
    for (let i = 0; i < n; ++i) {
      if (predicates[i].apply(this, arguments)) {
        return true
      }
    }
    return false
  }
}
