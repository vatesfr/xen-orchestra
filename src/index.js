import forEach from 'lodash.foreach'

function listener (status) {
  let nSuccess = 0
  let nCalls = 0

  // Backup status for each vm
  forEach(status.calls, call => {
    let vmStatus

    if (call.error) {
      vmStatus = 'Fail'
    } else {
      nSuccess++
      vmStatus = 'Success'
    }

    nCalls++

    const vm = this._xo.getObject(call.params.id)

    console.log(
      `VM Name: ${vm.name_label}
      UUID: ${call.params.id}
      Status: ${vmStatus}
      Start time: ${call.start}
      End time: ${call.end}
      Duration: ${call.end - call.start}
      `
    )
  })

  const globalStatus = nSuccess === nCalls
        ? 'Success'
        : 'Fail'

  // Global status
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
    this._xo.removeListener(listener)
  }
}

// ===================================================================

export default ({xo}) => new BackupReportsXoPlugin(xo)
