import escapeRegExp from 'lodash/escapeRegExp'

const compileFragment = pattern =>
  new RegExp(
    `^${pattern
      .split('*')
      .map(escapeRegExp)
      .join('[^]*')}$`
  )

export function parseGlob(pattern) {
  const parts = []
  while (pattern.length !== 0) {
    const i = pattern.indexOf('*')
    if (i === -1) {
      parts.push(pattern)
      break
    }

    let fragmentStart = pattern.lastIndexOf('/', i)
    if (fragmentStart === -1) {
      fragmentStart = 0
    } else {
      parts.push(pattern.slice(0, fragmentStart))
      ++fragmentStart
    }

    let fragmentEnd = pattern.indexOf('/', i)
    if (fragmentEnd === -1) {
      fragmentEnd = pattern.length
    }

    parts.push(compileFragment(pattern.slice(fragmentStart, fragmentEnd)))

    pattern = pattern.slice(fragmentEnd + 1)
  }
  return parts
}
