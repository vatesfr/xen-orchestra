export default function isEmpty (object) {
  /* eslint no-unused-vars: 0 */
  for (const key in object) {
    return false
  }
  return true
}
