// @flow

// patch o: assign properties from p
// if the value of a p property is null, delete it from o
const patch = <T: {}>(o: T, p: $Shape<T>) => {
  Object.keys(p).forEach(k => {
    const v: any = p[k]
    if (v === null) {
      delete o[k]
    } else if (v !== undefined) {
      o[k] = v
    }
  })
}
export { patch as default }
