export default function clearObject(object) {
  for (const key in object) {
    delete object[key]
  }
}
