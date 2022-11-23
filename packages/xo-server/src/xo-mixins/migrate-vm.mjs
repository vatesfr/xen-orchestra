import { Backup } from '@xen-orchestra/backups/Backup.js'

export default class VmMover {
  constructor(app) {
    this._app = app
  }

  async warmMigrateVm(sourceVmId, srId, startDestVm = true, deleteSource = false, { warmingCycle = 1 } = {}) {
    // we'll use a one time use continuous replication job with the VM to migrate

    const app = this._app
    const sourceVm = app.getXapiObject(sourceVmId)
    const config = {
      snapshotNameLabelTpl: '[XO Lukewarm migration {job.name}] {vm.name_label}',
    }
    const job = {
      type: 'backup',
      id: 'import',
      mode: 'delta',
      vms: { id: sourceVmId },
      name: `Lukewarm migration`,
      srs: { id: srId },
      settings: {
        '': {
          // mandatory for delta replication writer
          copyRetention: 1,
        },
      },
    }
    const schedule = { id: 'one-time' }

    // for now we only support this from the main OA, no proxy
    const backup = new Backup({
      config,
      job,
      schedule,
      getAdapter: async remoteId => app.getBackupsRemoteAdapter(await app.getRemoteWithCredentials(remoteId)),

      // `@xen-orchestra/backups/Backup` expect that `getConnectedRecord` returns a promise
      getConnectedRecord: async (xapiType, uuid) => app.getXapiObject(uuid),
    })
    // run a few time to have a a warm target , as close as possible as the hot one running
    for (let cycle = 0; cycle < warmingCycle; cycle++) {
      await backup.run()
    }
    const xapi = sourceVm.$xapi
    const ref = sourceVm.$ref

    // stop the source VM before
    try {
      await xapi.callAsync('VM.clean_shutdown', ref)
    } catch (error) {
      await xapi.callAsync('VM.hard_shutdown', ref)
    }
    // make it so it can't be restarted by error
    await sourceVm.update_blocked_operations({
      start: 'Start operation for this vm is blocked, clone it if you want to use it.',
      start_on: 'Start operation for this vm is blocked, clone it if you want to use it.',
    })
    // run the transfer again to transfer the changed parts
    // since the source is stopped, there won't be any new change
    await backup.run()
    // now we can start the destination VM
    // find it
    const targets = Object.keys(
      app.getObjects({
        filter: obj => {
          return (
            'other' in obj &&
            obj.other['xo:backup:job'] === job.id &&
            obj.other['xo:backup:sr'] === srId &&
            obj.other['xo:backup:vm'] === sourceVm.uuid &&
            'start' in obj.blockedOperations
          )
        },
      })
    )
    if (targets.length === 0) {
      throw new Error(`Vm target of lukewarm migration not found for ${sourceVmId} on SR ${srId} `)
    }
    if (targets.length > 1) {
      throw new Error(`Multiple target of lukewarm migration found for ${sourceVmId} on SR ${srId} `)
    }
    const targetVm = app.getXapiObject(targets[0])

    // new vm is ready to start
    // delta replication writer as set this as blocked
    await targetVm.update_blocked_operations({ start: null, start_on: null })

    if (startDestVm) {
      // boot it
      await targetVm.$xapi.startVm(targetVm.$ref)
      // wait for really started
      // delete source
      if (deleteSource) {
        sourceVm.$xapi.VM_destroy(sourceVm.$ref)
      } else {
        // @todo should we delete the snapshot if we keep the source vm ?
      }
    }
  }
}
