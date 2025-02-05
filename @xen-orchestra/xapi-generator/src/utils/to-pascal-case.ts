export function toPascalCase(str: string) {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.toLowerCase().slice(1))
    .join('')
}
