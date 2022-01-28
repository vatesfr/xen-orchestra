export default function isEmpty(object) {
  // eslint-disable-next-line no-unreachable-loop
  for (const key in object) {
    return false
  }
  return true
}
