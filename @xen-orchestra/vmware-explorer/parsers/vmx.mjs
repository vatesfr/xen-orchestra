function set(obj, keyPath, val) {
  let [key, ...other] = keyPath

  if (key.includes(':')) {
    // it's an array
    let index
    ;[key, index] = key.split(':')
    index = parseInt(index)
    if (!obj[key]) {
      // first time on this array
      obj[key] = []
    }
    if (!other.length) {
      // without descendant
      obj[key][index] = val
    } else {
      // with descendant
      if (!obj[key][index]) {
        // first time on this descendant
        obj[key][index] = {}
      }
      set(obj[key][index], other, val)
    }
  } else {
    // it's an object
    if (!other.length) {
      // wihtout descendant
      obj[key] = val
    } else {
      // with descendant
      if (obj[key] === undefined) {
        // first time
        obj[key] = {}
      }
      set(obj[key], other, val)
    }
  }
}

// this file contains the vm configuration
export default function parseVmx(text) {
  const vmx = {}
  text.split('\n').forEach(line => {
    const [key, val] = line.split(' = ')
    set(vmx, key.split('.'), val?.substring(1, val.length - 1))
  })
  return vmx
}
