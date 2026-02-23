export function renderFilter(property: string, value: string, negate: boolean) {
  if (value === '') {
    return ''
  }

  const negateToken = negate ? '!' : ''

  const joinToken = property === '' ? '' : ':'

  return `${negateToken}${property}${joinToken}${value}`
}
