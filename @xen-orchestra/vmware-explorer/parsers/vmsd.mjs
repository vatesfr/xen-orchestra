// these files contains the snapshot history of the VM

function set(obj, keyPath, val){
  const [key, ...other] = keyPath
  const match = key.match(/^(.+)([0-9])$/)
  if(match){
    // an array
    let [_,label, index] = match
    label +='s'
    if(!obj[label]){
      obj[label] = []
    }
    if(other.length){
      if(!obj[label][index]){
        obj[label][parseInt(index)] = {}
      }
      set(obj[label][index], other, val)
    }else {
      obj[label][index] = val
    }
  } else{
    if(other.length){
      // an object
      if(!obj[key]){
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

export default function parseVmsd(text){
  const  parsed ={}
  text.split('\n').forEach(line => {
    const [key, val] = line.split(' = ')
    if(!key.startsWith('snapshot')){
      return
    }

    set(parsed, key.split('.'), val?.substring(1, val.length - 1))
  })
  console.log('vmsd',{
    lastUID: parsed.snapshot.current,
    current: parsed.snapshot.current,
    numSnapshots: parsed.snapshot.numSnapshots,

  })

  return {
    lastUID: parsed.snapshot.current,
    current: parsed.snapshot.current,
    numSnapshots: parsed.snapshot.numSnapshots,
    snapshots: Object.values(parsed.snapshots) || []
  }

}
