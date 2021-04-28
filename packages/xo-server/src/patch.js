// patch o: assign properties from p
// if the value of a p property is null, delete it from o
const patch = (o, p) => {
  Object.keys(p).forEach(k => {
    const v = p[k]
    if (v === null) {
      delete o[k]
    } else if (v !== undefined) {
      o[k] = v
    }
  })
}
export { patch as default }
