export default function clearObject (object) {
  for (let key in object) {
    delete object[key]
  }
}
