export function compareStrings(string1: string, string2: string) {
  return string1.localeCompare(string2, undefined, { numeric: true })
}
