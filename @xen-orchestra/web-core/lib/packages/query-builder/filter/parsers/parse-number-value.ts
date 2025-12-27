export function parseNumberValue(value: string = '') {
  const number = parseFloat(value)

  if (isNaN(number)) {
    return ''
  }

  return number
}
