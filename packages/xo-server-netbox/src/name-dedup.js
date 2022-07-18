import { NAME_MAX_LENGTH } from '.'

export function indexName(name, index) {
  const suffix = ` (${index})`

  return name.slice(0, NAME_MAX_LENGTH - suffix.length) + suffix
}

// Compares name with the collection of usedNames and returns the next available
// name in the format "My Name (n)"
export function deduplicateName(name, usedNames) {
  let index = 1
  let uniqName = name
  while (index < 1e3 && usedNames.includes(uniqName)) {
    uniqName = indexName(name, index++, NAME_MAX_LENGTH)
  }
  if (index === 1e3) {
    throw new Error(`Cannot deduplicate name ${name}`)
  }

  return uniqName
}

// Checks if 2 names are identical or if their difference is only due to name
// deduplication
export function compareNames(original, copy) {
  if (original === copy) {
    return true
  }

  const match = copy.match(/.* \((\d+)\)$/)
  return match !== null && indexName(original, match[1], NAME_MAX_LENGTH) === copy
}
