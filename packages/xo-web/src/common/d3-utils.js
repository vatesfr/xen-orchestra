import forEach from 'lodash/forEach'

export function setStyles(style) {
  forEach(style, (value, key) => {
    this.style(key, value)
  })

  return this
}
