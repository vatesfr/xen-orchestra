import forEach from 'lodash.foreach'

function listener (status) {
  let nSuccess = 0
  let nCalls = 0

  forEach(status.calls, call => {
    // Ignore call if it's not a Backup or a Snapshot.
    if (call.method !== 'vm.rollingBackup' && call.method !== 'vm.rollingSnapshot') {
      return
    }

    let vmStatus

    if (call.error) {
      vmStatus = 'Fail'
    } else {
      nSuccess++
      vmStatus = 'Success'
    }

    nCalls++

    let vmName

    try {
      const vm = this._xo.getObject(call.params.id)
      vmName = vm.name_label
    } catch (e) {
      vmName = 'NoSuchObject, no vm name found'
    }

    console.log(
      `VM Name: ${vmName}
      UUID: ${call.params.id}
      Status: ${vmStatus}
      Start time: ${call.start}
      End time: ${call.end}
      Duration: ${call.end - call.start}
      `
    )
  })

  // No backup calls.
  if (nCalls === 0) {
    return
  }

  const globalStatus = nSuccess === nCalls
        ? 'Success'
        : 'Fail'

  // Global status.
  console.log(
    `Global status: ${globalStatus}
    Start time: ${status.start}
    End time: ${status.end}
    Duration: ${status.end - status.start}
    Successful backed up VM number: ${nSuccess}
    Failed backed up VM: ${nCalls - nSuccess}
    `
  )
}

class BackupReportsXoPlugin {
  constructor (xo) {
    this._xo = xo
  }

  configure (conf) {
    this._conf = conf
  }

  load () {
    this._xo.on('job:terminated', listener)
  }

  unload () {
    this._xo.removeListener('job:terminated', listener)
  }
}

// ===================================================================

export default ({xo}) => new BackupReportsXoPlugin(xo)
