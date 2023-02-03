// the vmsd file contain the snapshot history of the VM , and their chaining

function set(obj, keyPath, val) {
  const [key, ...other] = keyPath
  // key like snapshot0->snapshot9 are grouped in an array snapshots[]
  const match = key.match(/^(.+)([0-9])$/)
  if (match) {
    // an array
    let [, label, index] = match
    // I like my array names in plural form
    label += 's'
    if (!obj[label]) {
      // create array if not exists
      obj[label] = []
    }
    if (other.length) {
      // it contains objects
      if (!obj[label][index]) {
        // and this object is not already initialized
        obj[label][parseInt(index)] = {}
      }
      set(obj[label][index], other, val)
    } else {
      // it contains a scalar value
      obj[label][index] = val
    }
  } else {
    if (other.length) {
      // an object
      if (!obj[key]) {
        // first time
        obj[key] = {}
      }
      set(obj[key], other, val)
    } else {
      // a scalar
      obj[key] = val
    }
  }
}

export default function parseVmsd(text) {
  const parsed = {}
  text.split('\n').forEach(line => {
    const [key, val] = line.split(' = ')
    if (!key.startsWith('snapshot')) {
      // we only look for the snapshot part of the file
      return
    }
    // remove the " around value
    set(parsed, key.split('.'), val?.substring(1, val.length - 1))
  })
  if (parsed.snapshot?.current === undefined) {
    return
  }

  return {
    lastUID: parsed.snapshot.current,
    current: parsed.snapshot.current,
    numSnapshots: parsed.snapshot.numSnapshots,
    snapshots: Object.values(parsed.snapshots) || [],
  }
}

/** file content example
 * .encoding = "UTF-8"
snapshot.lastUID = "4"
snapshot.current = "4"
snapshot0.uid = "1"
snapshot0.filename = "test flo-Snapshot1.vmsn"
snapshot0.displayName = "SNAPSHOT POST INSTALL"
snapshot0.description = "blablabla"
snapshot0.createTimeHigh = "388745"
snapshot0.createTimeLow = "1991180826"
snapshot0.numDisks = "1"
snapshot0.disk0.fileName = "test flo_0.vmdk"
snapshot0.disk0.node = "scsi0:0"
snapshot.numSnapshots = "4"
snapshot1.uid = "2"
snapshot1.filename = "test flo-Snapshot2.vmsn"
snapshot1.parent = "1"
snapshot1.displayName = "SECOND"
snapshot1.description = "small"
snapshot1.createTimeHigh = "388801"
snapshot1.createTimeLow = "-814770620"
snapshot1.numDisks = "1"
snapshot1.disk0.fileName = "test flo_0-000001.vmdk"
snapshot1.disk0.node = "scsi0:0"
snapshot2.uid = "3"
snapshot2.filename = "test flo-Snapshot3.vmsn"
snapshot2.parent = "2"
snapshot2.displayName = "third"
snapshot2.type = "1"
snapshot2.createTimeHigh = "388802"
snapshot2.createTimeLow = "96936632"
snapshot2.numDisks = "1"
snapshot2.disk0.fileName = "test flo_0-000002.vmdk"
snapshot2.disk0.node = "scsi0:0"
snapshot3.uid = "4"
snapshot3.filename = "test flo-Snapshot4.vmsn"
snapshot3.parent = "3"
snapshot3.displayName = "from cli"
snapshot3.type = "1"
snapshot3.createTimeHigh = "388804"
snapshot3.createTimeLow = "1541463919"
snapshot3.numDisks = "1"
snapshot3.disk0.fileName = "test flo_0-000003.vmdk"
snapshot3.disk0.node = "scsi0:0"
 */
